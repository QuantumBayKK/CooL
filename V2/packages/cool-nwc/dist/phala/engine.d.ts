/**
 * The evidence plane — the part that runs INSIDE the enclave.
 *
 * Everything in this file assumes it is executing on measured code with sealed
 * keys. It receives events over an attested channel, and for each one it does
 * the four things that make a record evidence rather than a log line:
 *
 *   1. commit  — salted hashes of the input, the output and the diff. Plaintext
 *                is hashed and discarded; the receipt never carries it.
 *   2. bind    — canonical CBOR of the core (which now includes the measurement
 *                and the quote digest) hashed to `binding_hash`.
 *   3. sign    — hybrid ML-DSA-65 + Ed25519, with the measurement-sealed key.
 *   4. log     — append the binding digest to the RFC 6962 transparency log and
 *                take a fresh signed tree head plus an inclusion proof.
 *
 * The ordering matters. The quote is fetched once at start-up, hashed, and the
 * hash placed in the core BEFORE signing — so the record signature covers the
 * attestation, and a valid quote cannot be moved onto a record it did not
 * attest. Build Plan §4, and the reason the two halves cannot be separated.
 */
import type { HexField, Multihash, STH } from "../types.js";
import type { EvidenceLog } from "./log.js";
import type { PolicyOutcome, PolicySet } from "./policy.js";
import type { DstackClient, EnclaveInfo } from "./dstack.js";
import { type SealedKeyset } from "./kms.js";
import type { AttestationV2, ChangeActor, ChangeApproval, ChangeKind, GpuAttestationRef, Measurement, QuoteEnvelope, ReceiptV2 } from "./types.js";
/** An inference that happened in the customer's application. */
export interface InferenceEvent {
    readonly kind: "inference";
    /** `id@version`, e.g. `phala/deepseek-v4-pro@2026.07`. */
    readonly model: string;
    readonly prompt: string;
    readonly output: string;
    readonly params?: unknown;
    readonly provider?: string;
    /** Real commitment to the weights, when the serving stack publishes one. */
    readonly weightsHash?: Multihash;
    /** Confidential-GPU attestation for this call, if inference ran in a GPU TEE. */
    readonly gpu?: GpuAttestationRef;
}
/** A change someone made to the AI system itself. */
export interface ChangeEvent {
    readonly kind: "change";
    readonly changeKind: ChangeKind;
    readonly ref: string;
    readonly environment: string;
    readonly before?: string;
    readonly after: string;
    readonly actor: ChangeActor;
    /**
     * An approval decided elsewhere. Omit it and the plane's policy set decides —
     * which is the point: a verdict reached inside the enclave is sealed by the
     * same signature as the change it approves, rather than asserted alongside it.
     */
    readonly approval?: ChangeApproval;
    /** Who signed off, for the policy engine to weigh. */
    readonly approvers?: readonly string[];
    /** Optional risk signal, 0–1, from whatever scoring model the customer runs. */
    readonly risk?: number;
    /** Labels the policy can match on: `owner:payments`, `tier:high`, `pii:true`. */
    readonly labels?: readonly string[];
}
export type CaptureEvent = InferenceEvent | ChangeEvent;
/** Options for {@link EvidencePlane.start}. */
export interface EvidencePlaneOptions {
    readonly client: DstackClient;
    /** Stable transparency-log id recorded in every STH. Default `cool-nwc`. */
    readonly logId?: string;
    /** The measurement this deployment approved, recorded in every receipt. */
    readonly expectedMeasurement?: Measurement;
    readonly clock?: () => string;
    readonly newId?: () => string;
    readonly newSalt?: () => HexField;
    readonly seq?: () => number;
    /**
     * Where records are appended. Defaults to an in-memory tree; pass a `FileLog`
     * (from `cool-nwc/node`) or a Trillian client to keep ONE tree across
     * restarts — which is what makes ordering and completeness provable rather
     * than a hundred separate trees of size one.
     */
    readonly log?: EvidenceLog;
    /** Governance rules, evaluated here rather than asserted by the caller. */
    readonly policy?: PolicySet;
}
export declare class EvidencePlane {
    readonly info: EnclaveInfo;
    readonly quote: QuoteEnvelope;
    readonly keys: SealedKeyset;
    readonly attestation: AttestationV2;
    private readonly log;
    private readonly policy;
    private lastOutcome;
    private readonly clock;
    private readonly newId;
    private readonly newSalt;
    private readonly nextSeq;
    private readonly directory;
    private readonly runtime;
    private constructor();
    /**
     * Boot the plane: read the TCB, derive sealed keys, and take one quote that
     * binds those keys to this measurement. Everything after this is pure.
     */
    static start(options: EvidencePlaneOptions): Promise<EvidencePlane>;
    /** Entries currently in the transparency log. */
    get logSize(): number;
    /** The policy outcome from the most recent change, when a policy is configured. */
    get lastPolicyOutcome(): PolicyOutcome | null;
    /** The current signed tree head — what a witness or auditor would gossip. */
    currentSTH(): STH;
    /** Seal one captured event into a complete, self-verifying receipt. */
    seal(event: CaptureEvent): ReceiptV2;
    private inferenceCore;
    /**
     * Decide, or accept a decision.
     *
     * A caller-supplied approval wins — plenty of deployments already have a
     * workflow engine and CooL's job is to seal its output, not to argue with it.
     * Otherwise the configured policy runs here, inside the enclave, and its
     * verdict is covered by the same signature as the change.
     */
    private decide;
    private changeCore;
}
