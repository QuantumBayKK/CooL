import { CaptureQueue } from "./capture.js";
import { SimulatedDstackClient } from "./dstack.js";
import { EvidencePlane } from "./engine.js";
import { AttestedChannel } from "./ratls.js";
export class CoolTee {
    plane;
    channel;
    queue;
    retained = [];
    retain;
    backend;
    constructor(plane, channel, options) {
        this.plane = plane;
        this.channel = channel;
        this.retain = options.retain ?? 500;
        this.backend = options.backend;
        this.queue = new CaptureQueue({
            ...(options.capture ?? {}),
            send: (batch) => this.channel.send(batch),
            onDrop: (envelope, reason) => {
                envelope.reject?.(new Error(`capture dropped: ${reason}`));
                options.onDrop?.(envelope.event, reason);
            },
        });
    }
    /**
     * Boot the SDK: attest, seal keys, open the channel.
     *
     * Ordering is the contract. `EvidencePlane.start` derives the sealed key and
     * takes a quote over it; the handshake then checks that quote against the
     * policy. Only if that passes does a queue exist to put events in.
     */
    static async connect(options = {}) {
        const client = options.dstack ??
            new SimulatedDstackClient({
                appName: options.app?.name ?? "cool-evidence-plane",
                imageDigest: options.app?.imageDigest ?? "sha256:unpinned-development-image",
            });
        const plane = await EvidencePlane.start({
            client,
            ...(options.logId === undefined ? {} : { logId: options.logId }),
            ...(options.log === undefined ? {} : { log: options.log }),
            ...(options.governance === undefined ? {} : { policy: options.governance }),
            ...(options.expectedMeasurement === undefined
                ? {}
                : { expectedMeasurement: options.expectedMeasurement }),
            ...(options.clock === undefined ? {} : { clock: options.clock }),
            ...(options.newId === undefined ? {} : { newId: options.newId }),
            ...(options.seq === undefined ? {} : { seq: options.seq }),
        });
        // The sink closes over the instance it is part of, so it is handed a holder
        // that is filled in once the channel exists. The alternative — constructing
        // the client before it has an attested channel — would allow an unattested
        // CoolTee to exist for a moment, which is the one state this design forbids.
        const holder = { instance: null };
        const channel = await AttestedChannel.connect({
            client,
            expectedKey: plane.keys.record.directoryEntry,
            policy: options.policy ?? {},
            sink: async (batch) => {
                // This runs INSIDE the enclave in a real deployment: the plaintext that
                // crossed the attested channel is committed and immediately discarded.
                for (const envelope of batch) {
                    const receipt = plane.seal(envelope.event);
                    holder.instance?.remember(receipt);
                    options.onReceipt?.(receipt);
                    envelope.resolve?.(receipt);
                }
            },
        });
        const instance = new CoolTee(plane, channel, options);
        holder.instance = instance;
        return instance;
    }
    remember(receipt) {
        this.retained.push(receipt);
        if (this.retained.length > this.retain)
            this.retained.shift();
    }
    /** The attestation transcript. Render it; it is the customer's proof. */
    get handshake() {
        return this.channel.handshake;
    }
    /** Public keys any verifier needs — publish this next to your receipts. */
    get keyDirectory() {
        return {
            [this.plane.keys.record.keyId]: this.plane.keys.record.directoryEntry,
            [this.plane.keys.log.keyId]: this.plane.keys.log.directoryEntry,
        };
    }
    /** Receipts retained in memory, newest last. */
    get receipts() {
        return this.retained;
    }
    /** Measured cost and loss of the capture path. Put this on your dashboard. */
    stats() {
        return this.queue.stats();
    }
    /**
     * Record an event. Synchronous, non-blocking, non-throwing — the call the
     * customer's hot path makes.
     */
    capture(event) {
        this.queue.capture({ event });
    }
    /** Record an event and resolve when its receipt exists. */
    captureSealed(event) {
        return new Promise((resolve, reject) => {
            this.queue.capture({ event, resolve, reject });
            void this.queue.flush();
        });
    }
    /**
     * Run the configured backend and capture the call.
     *
     * Returns as soon as the model does. The evidence is produced on the queue
     * behind it — if the evidence plane is unreachable the customer still gets
     * their completion, and the loss shows up in {@link stats}.
     */
    async complete(request) {
        if (!this.backend)
            throw new Error("CoolTee.complete requires a `backend` option");
        const at = request.model.lastIndexOf("@");
        const id = at <= 0 ? request.model : request.model.slice(0, at);
        const version = at <= 0 ? "0" : request.model.slice(at + 1);
        const result = await this.backend({
            model: id,
            version,
            prompt: request.prompt,
            params: request.params ?? {},
        });
        const event = {
            kind: "inference",
            model: request.model,
            prompt: request.prompt,
            output: result.output,
            params: request.params ?? {},
            ...(result.provider === undefined ? {} : { provider: result.provider }),
            ...(result.weightsHash === undefined ? {} : { weightsHash: result.weightsHash }),
            ...(result.gpu === undefined ? {} : { gpu: result.gpu }),
        };
        this.capture(event);
        return { output: result.output };
    }
    /** Run the backend and wait for the sealed receipt. Used by tests and demos. */
    async completeSealed(request) {
        if (!this.backend)
            throw new Error("CoolTee.completeSealed requires a `backend` option");
        const at = request.model.lastIndexOf("@");
        const id = at <= 0 ? request.model : request.model.slice(0, at);
        const version = at <= 0 ? "0" : request.model.slice(at + 1);
        const result = await this.backend({
            model: id,
            version,
            prompt: request.prompt,
            params: request.params ?? {},
        });
        const receipt = await this.captureSealed({
            kind: "inference",
            model: request.model,
            prompt: request.prompt,
            output: result.output,
            params: request.params ?? {},
            ...(result.provider === undefined ? {} : { provider: result.provider }),
            ...(result.weightsHash === undefined ? {} : { weightsHash: result.weightsHash }),
            ...(result.gpu === undefined ? {} : { gpu: result.gpu }),
        });
        return { output: result.output, receipt };
    }
    /** Record a change to the AI system itself and wait for its receipt. */
    change(request) {
        const event = {
            kind: "change",
            changeKind: request.kind,
            ref: request.ref,
            environment: request.environment ?? "prod",
            after: request.after,
            actor: request.actor,
            ...(request.before === undefined ? {} : { before: request.before }),
            ...(request.approval === undefined ? {} : { approval: request.approval }),
            ...(request.approvers === undefined ? {} : { approvers: request.approvers }),
            ...(request.risk === undefined ? {} : { risk: request.risk }),
            ...(request.labels === undefined ? {} : { labels: request.labels }),
        };
        return this.captureSealed(event);
    }
    /** Flush the queue — call before a process exits. */
    flush() {
        return this.queue.flush();
    }
    /** Stop capturing and drain. */
    close() {
        return this.queue.close();
    }
}
//# sourceMappingURL=client.js.map