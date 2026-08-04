/**
 * `CoolTee` — the client an application actually imports.
 *
 * Three lines to adopt:
 *
 *     const cool = await CoolTee.connect({ app: { name: "refund-agent", imageDigest } });
 *     const { output } = await cool.complete({ model: "phala/deepseek-v4-pro@2026.07", prompt });
 *     await cool.change({ kind: "prompt", ref: "refund-agent#system", after: nextPrompt, actor });
 *
 * Behind those three lines the full path runs: the dstack client reads the TCB,
 * dstack-KMS seals a signing key to the measurement, an RA-TLS handshake proves
 * the evidence plane before a single byte is transmitted, and every event is
 * queued out-of-band so the customer's inference is never waiting on us.
 *
 * The class is a wiring diagram more than an implementation — capture, transport
 * and sealing each live in their own module and are individually testable. What
 * it adds is the ordering, which is the part that is easy to get wrong: attest
 * BEFORE opening the queue, seal INSIDE the plane, and never let a failure in
 * any of it reach the caller's request path.
 */
import type { KeyDirectory, Multihash } from "../types.js";
import { type CaptureOptions, type CaptureStats } from "./capture.js";
import { type DstackClient } from "./dstack.js";
import { EvidencePlane, type CaptureEvent } from "./engine.js";
import { AttestedChannel, type AttestationHandshake, type AttestationPolicy } from "./ratls.js";
import type { ChangeActor, ChangeApproval, ChangeKind, GpuAttestationRef, Measurement, ReceiptV2 } from "./types.js";
/** What a model backend returns to the SDK. */
export interface TeeBackendResult {
    readonly output: string;
    /** Real commitment to the weights, if the serving stack publishes one. */
    readonly weightsHash?: Multihash;
    /** Confidential-GPU attestation for this call, if there was one. */
    readonly gpu?: GpuAttestationRef;
    readonly provider?: string;
}
/** A pluggable model backend — the SDK's ONLY outbound call. */
export type TeeBackend = (args: {
    readonly model: string;
    readonly version: string;
    readonly prompt: string;
    readonly params: unknown;
}) => Promise<TeeBackendResult> | TeeBackendResult;
/** Options for {@link CoolTee.connect}. */
export interface CoolTeeOptions {
    /**
     * The enclave to run the evidence plane in. Omit it and the SDK spins up the
     * simulator from `app` — the same code path, no hardware, clearly labelled.
     */
    readonly dstack?: DstackClient;
    /** Identity of the deployed image, when using the built-in simulator. */
    readonly app?: {
        readonly name: string;
        readonly imageDigest: string;
    };
    /** What the client demands of the endpoint before transmitting. */
    readonly policy?: AttestationPolicy;
    /** The measurement this deployment approved, recorded in every receipt. */
    readonly expectedMeasurement?: Measurement;
    readonly logId?: string;
    /** Where records are appended. See {@link EvidencePlaneOptions.log}. */
    readonly log?: import("./log.js").EvidenceLog;
    /**
     * Governance rules, evaluated inside the enclave. Distinct from `policy`
     * above, which governs whether the CHANNEL opens; this one governs whether a
     * CHANGE is allowed, and its verdict is sealed into the record.
     */
    readonly governance?: import("./policy.js").PolicySet;
    readonly backend?: TeeBackend;
    readonly onReceipt?: (receipt: ReceiptV2) => void;
    readonly onDrop?: (event: CaptureEvent, reason: string) => void;
    /** Capture tuning. Defaults are fine for a web service. */
    readonly capture?: Pick<CaptureOptions<never>, "maxQueue" | "flushMs" | "batchSize" | "maxRetries" | "setTimer" | "clearTimer" | "now">;
    readonly clock?: () => string;
    readonly newId?: () => string;
    readonly seq?: () => number;
    /** How many receipts to keep in memory for the console. Default 500. */
    readonly retain?: number;
}
/** Internal queue envelope: the event, plus who is waiting for its receipt. */
interface Envelope {
    readonly event: CaptureEvent;
    readonly resolve?: (receipt: ReceiptV2) => void;
    readonly reject?: (error: Error) => void;
}
/** A change submitted through {@link CoolTee.change}. */
export interface ChangeRequest {
    readonly kind: ChangeKind;
    readonly ref: string;
    readonly after: string;
    readonly before?: string;
    readonly environment?: string;
    readonly actor: ChangeActor;
    readonly approval?: ChangeApproval;
    /** Who signed off — the policy engine weighs these when no approval is given. */
    readonly approvers?: readonly string[];
    /** Risk signal, 0–1, from the customer's own model. */
    readonly risk?: number;
    readonly labels?: readonly string[];
}
export declare class CoolTee {
    readonly plane: EvidencePlane;
    readonly channel: AttestedChannel<Envelope>;
    private readonly queue;
    private readonly retained;
    private readonly retain;
    private readonly backend;
    private constructor();
    /**
     * Boot the SDK: attest, seal keys, open the channel.
     *
     * Ordering is the contract. `EvidencePlane.start` derives the sealed key and
     * takes a quote over it; the handshake then checks that quote against the
     * policy. Only if that passes does a queue exist to put events in.
     */
    static connect(options?: CoolTeeOptions): Promise<CoolTee>;
    private remember;
    /** The attestation transcript. Render it; it is the customer's proof. */
    get handshake(): AttestationHandshake;
    /** Public keys any verifier needs — publish this next to your receipts. */
    get keyDirectory(): KeyDirectory;
    /** Receipts retained in memory, newest last. */
    get receipts(): readonly ReceiptV2[];
    /** Measured cost and loss of the capture path. Put this on your dashboard. */
    stats(): CaptureStats;
    /**
     * Record an event. Synchronous, non-blocking, non-throwing — the call the
     * customer's hot path makes.
     */
    capture(event: CaptureEvent): void;
    /** Record an event and resolve when its receipt exists. */
    captureSealed(event: CaptureEvent): Promise<ReceiptV2>;
    /**
     * Run the configured backend and capture the call.
     *
     * Returns as soon as the model does. The evidence is produced on the queue
     * behind it — if the evidence plane is unreachable the customer still gets
     * their completion, and the loss shows up in {@link stats}.
     */
    complete(request: {
        model: string;
        prompt: string;
        params?: unknown;
    }): Promise<{
        output: string;
    }>;
    /** Run the backend and wait for the sealed receipt. Used by tests and demos. */
    completeSealed(request: {
        model: string;
        prompt: string;
        params?: unknown;
    }): Promise<{
        output: string;
        receipt: ReceiptV2;
    }>;
    /** Record a change to the AI system itself and wait for its receipt. */
    change(request: ChangeRequest): Promise<ReceiptV2>;
    /** Flush the queue — call before a process exits. */
    flush(): Promise<void>;
    /** Stop capturing and drain. */
    close(): Promise<void>;
}
export {};
