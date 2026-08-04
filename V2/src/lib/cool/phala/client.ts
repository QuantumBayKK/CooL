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
import type { KeyDirectory, Multihash } from "../types";
import { CaptureQueue, type CaptureOptions, type CaptureStats } from "./capture";
import { SimulatedDstackClient, type DstackClient } from "./dstack";
import { EvidencePlane, type CaptureEvent, type ChangeEvent, type InferenceEvent } from "./engine";
import { AttestedChannel, type AttestationHandshake, type AttestationPolicy } from "./ratls";
import type {
  ChangeActor,
  ChangeApproval,
  ChangeKind,
  GpuAttestationRef,
  Measurement,
  ReceiptV2,
} from "./types";

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
  readonly app?: { readonly name: string; readonly imageDigest: string };
  /** What the client demands of the endpoint before transmitting. */
  readonly policy?: AttestationPolicy;
  /** The measurement this deployment approved, recorded in every receipt. */
  readonly expectedMeasurement?: Measurement;
  readonly logId?: string;
  /** Where records are appended. See {@link EvidencePlaneOptions.log}. */
  readonly log?: import("./log").EvidenceLog;
  /**
   * Governance rules, evaluated inside the enclave. Distinct from `policy`
   * above, which governs whether the CHANNEL opens; this one governs whether a
   * CHANGE is allowed, and its verdict is sealed into the record.
   */
  readonly governance?: import("./policy").PolicySet;
  readonly backend?: TeeBackend;
  readonly onReceipt?: (receipt: ReceiptV2) => void;
  readonly onDrop?: (event: CaptureEvent, reason: string) => void;
  /** Capture tuning. Defaults are fine for a web service. */
  readonly capture?: Pick<
    CaptureOptions<never>,
    "maxQueue" | "flushMs" | "batchSize" | "maxRetries" | "setTimer" | "clearTimer" | "now"
  >;
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

export class CoolTee {
  private readonly queue: CaptureQueue<Envelope>;
  private readonly retained: ReceiptV2[] = [];
  private readonly retain: number;
  private readonly backend: TeeBackend | undefined;

  private constructor(
    readonly plane: EvidencePlane,
    readonly channel: AttestedChannel<Envelope>,
    options: CoolTeeOptions,
  ) {
    this.retain = options.retain ?? 500;
    this.backend = options.backend;
    this.queue = new CaptureQueue<Envelope>({
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
  static async connect(options: CoolTeeOptions = {}): Promise<CoolTee> {
    const client: DstackClient =
      options.dstack ??
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
    const holder: { instance: CoolTee | null } = { instance: null };

    const channel = await AttestedChannel.connect<Envelope>({
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

  private remember(receipt: ReceiptV2): void {
    this.retained.push(receipt);
    if (this.retained.length > this.retain) this.retained.shift();
  }

  /** The attestation transcript. Render it; it is the customer's proof. */
  get handshake(): AttestationHandshake {
    return this.channel.handshake;
  }

  /** Public keys any verifier needs — publish this next to your receipts. */
  get keyDirectory(): KeyDirectory {
    return {
      [this.plane.keys.record.keyId]: this.plane.keys.record.directoryEntry,
      [this.plane.keys.log.keyId]: this.plane.keys.log.directoryEntry,
    };
  }

  /** Receipts retained in memory, newest last. */
  get receipts(): readonly ReceiptV2[] {
    return this.retained;
  }

  /** Measured cost and loss of the capture path. Put this on your dashboard. */
  stats(): CaptureStats {
    return this.queue.stats();
  }

  /**
   * Record an event. Synchronous, non-blocking, non-throwing — the call the
   * customer's hot path makes.
   */
  capture(event: CaptureEvent): void {
    this.queue.capture({ event });
  }

  /** Record an event and resolve when its receipt exists. */
  captureSealed(event: CaptureEvent): Promise<ReceiptV2> {
    return new Promise<ReceiptV2>((resolve, reject) => {
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
  async complete(request: {
    model: string;
    prompt: string;
    params?: unknown;
  }): Promise<{ output: string }> {
    if (!this.backend) throw new Error("CoolTee.complete requires a `backend` option");
    const at = request.model.lastIndexOf("@");
    const id = at <= 0 ? request.model : request.model.slice(0, at);
    const version = at <= 0 ? "0" : request.model.slice(at + 1);

    const result = await this.backend({
      model: id,
      version,
      prompt: request.prompt,
      params: request.params ?? {},
    });

    const event: InferenceEvent = {
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
  async completeSealed(request: {
    model: string;
    prompt: string;
    params?: unknown;
  }): Promise<{ output: string; receipt: ReceiptV2 }> {
    if (!this.backend) throw new Error("CoolTee.completeSealed requires a `backend` option");
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
  change(request: ChangeRequest): Promise<ReceiptV2> {
    const event: ChangeEvent = {
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
  flush(): Promise<void> {
    return this.queue.flush();
  }

  /** Stop capturing and drain. */
  close(): Promise<void> {
    return this.queue.close();
  }
}
