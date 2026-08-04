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
import type {
  HexField,
  Inclusion,
  KeyDirectory,
  Multihash,
  RecordTime,
  STH,
} from "../types";
import { canonicalCbor } from "../canonical";
import { utf8 } from "../codec";
import { randomSalt, saltedCommit } from "../hash";
import { mergeDirectories } from "../keys";
import { MemoryLog } from "../log-memory";
import type { EvidenceLog } from "./log";
import { approvalFrom, evaluate } from "./policy";
import type { PolicyOutcome, PolicySet } from "./policy";
import { mhSha256 } from "../multihash";
import { hybridSign } from "../sign";
import { ulid } from "./ulid";
import type { DstackClient, EnclaveInfo } from "./dstack";
import { sealedKeyset, type SealedKeyset } from "./kms";
import { enclaveReportData, quoteDigest } from "./quote";
import { bindingHashV2, recordLeafDataV2, recordSigningMessageV2, signedRecordV2 } from "./record";
import { unifiedDiff } from "./diff";
import type {
  AttestationV2,
  ChangeActor,
  ChangeApproval,
  ChangeCoreV2,
  ChangeKind,
  GpuAttestationRef,
  InferenceCoreV2,
  Measurement,
  QuoteEnvelope,
  ReceiptV2,
  RuntimeBlockV2,
} from "./types";

/* ── events crossing the attested channel ─────────────────────────────── */

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

/* ── the plane ────────────────────────────────────────────────────────── */

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

/** The default salted-commitment note recorded when nothing real is available. */
function mockWeightsHash(id: string, version: string): Multihash {
  return mhSha256(utf8(`cool-mock-weights:${id}@${version}`));
}

function parseModelRef(ref: string): { id: string; version: string } {
  const at = ref.lastIndexOf("@");
  return at <= 0 ? { id: ref, version: "0" } : { id: ref.slice(0, at), version: ref.slice(at + 1) };
}

export class EvidencePlane {
  private readonly log: EvidenceLog;
  private readonly policy: PolicySet | null;
  private lastOutcome: PolicyOutcome | null = null;
  private readonly clock: () => string;
  private readonly newId: () => string;
  private readonly newSalt: () => HexField;
  private readonly nextSeq: () => number;
  private readonly directory: KeyDirectory;
  private readonly runtime: RuntimeBlockV2;

  private constructor(
    readonly info: EnclaveInfo,
    readonly quote: QuoteEnvelope,
    readonly keys: SealedKeyset,
    readonly attestation: AttestationV2,
    options: EvidencePlaneOptions,
    extraDirectory: KeyDirectory,
  ) {
    this.clock = options.clock ?? (() => new Date().toISOString());
    this.newId = options.newId ?? (() => ulid());
    this.newSalt = options.newSalt ?? (() => randomSalt());
    let counter = 0;
    this.nextSeq = options.seq ?? (() => counter++);
    this.log = options.log ?? new MemoryLog(options.logId ?? "cool-nwc", keys.log);
    this.policy = options.policy ?? null;
    this.directory = { ...mergeDirectories(keys.record, keys.log), ...extraDirectory };
    this.runtime = {
      tee_vendor: info.vendor,
      mode: info.mode,
      enclave_measurement: info.measurement,
      tee_quote: quoteDigest(quote),
      gpu: null,
    };
  }

  /**
   * Boot the plane: read the TCB, derive sealed keys, and take one quote that
   * binds those keys to this measurement. Everything after this is pure.
   */
  static async start(options: EvidencePlaneOptions): Promise<EvidencePlane> {
    const info = await options.client.info();
    const keys = await sealedKeyset(options.client);
    const reportData = enclaveReportData(keys.record.directoryEntry);
    const quote = await options.client.getQuote(reportData);

    const attestation: AttestationV2 = {
      mode: info.mode,
      note:
        info.mode === "hardware"
          ? `${info.vendor} quote via dstack; keys sealed to the enclave measurement`
          : "SIMULATED — structurally complete quote under a CooL-held root, NOT hardware evidence",
      quote,
      expected_measurement: options.expectedMeasurement ?? null,
      key_binding: reportData,
    };

    return new EvidencePlane(
      info,
      quote,
      keys,
      attestation,
      options,
      options.client.directory(),
    );
  }

  /** Entries currently in the transparency log. */
  get logSize(): number {
    return this.log.size;
  }

  /** The policy outcome from the most recent change, when a policy is configured. */
  get lastPolicyOutcome(): PolicyOutcome | null {
    return this.lastOutcome;
  }

  /** The current signed tree head — what a witness or auditor would gossip. */
  currentSTH(): STH {
    return this.log.buildSTH(this.clock());
  }

  /** Seal one captured event into a complete, self-verifying receipt. */
  seal(event: CaptureEvent): ReceiptV2 {
    const time: RecordTime = { issued_at: this.clock(), seq: this.nextSeq() };
    const core =
      event.kind === "inference"
        ? this.inferenceCore(event, time)
        : this.changeCore(event, time);

    const binding = bindingHashV2(core);
    const signature = hybridSign(recordSigningMessageV2(core, binding), this.keys.record);
    const record = signedRecordV2(core, signature);

    const { leafIndex } = this.log.append(recordLeafDataV2(binding));
    const sth = this.log.buildSTH(this.clock());
    const inclusion: Inclusion = {
      leaf_index: leafIndex,
      tree_size: sth.tree_size,
      audit_path: this.log.inclusionAuditPath(leafIndex),
    };

    return {
      schema: "cool.receipt.v2",
      record,
      binding_hash: binding,
      inclusion,
      sth,
      attestation: this.attestation,
      anchor: null,
      key_directory: this.directory,
    };
  }

  private inferenceCore(event: InferenceEvent, time: RecordTime): InferenceCoreV2 {
    const { id, version } = parseModelRef(event.model);
    const inputSalt = this.newSalt();
    const outputSalt = this.newSalt();
    const runtime: RuntimeBlockV2 = event.gpu
      ? { ...this.runtime, gpu: event.gpu }
      : this.runtime;

    return {
      schema: "cool.inference.v2",
      record_id: this.newId(),
      time,
      model: {
        id,
        version,
        weights_hash: event.weightsHash ?? mockWeightsHash(id, version),
        provider: event.provider ?? "unknown",
      },
      request: {
        input_hash: saltedCommit(inputSalt, event.prompt),
        input_salt: inputSalt,
        params_hash: mhSha256(canonicalCbor(event.params ?? {})),
      },
      response: {
        output_hash: saltedCommit(outputSalt, event.output),
        output_salt: outputSalt,
      },
      runtime,
    };
  }

  /**
   * Decide, or accept a decision.
   *
   * A caller-supplied approval wins — plenty of deployments already have a
   * workflow engine and CooL's job is to seal its output, not to argue with it.
   * Otherwise the configured policy runs here, inside the enclave, and its
   * verdict is covered by the same signature as the change.
   */
  private decide(event: ChangeEvent): ChangeApproval | null {
    if (event.approval) {
      this.lastOutcome = null;
      return event.approval;
    }
    if (!this.policy) {
      this.lastOutcome = null;
      return null;
    }
    const approvers = event.approvers ?? [];
    const outcome = evaluate(this.policy, {
      kind: event.changeKind,
      ref: event.ref,
      environment: event.environment,
      actor: event.actor,
      approvers,
      ...(event.risk === undefined ? {} : { risk: event.risk }),
      ...(event.labels === undefined ? {} : { labels: event.labels }),
    });
    this.lastOutcome = outcome;
    return approvalFrom(outcome, approvers);
  }

  private changeCore(event: ChangeEvent, time: RecordTime): ChangeCoreV2 {
    const beforeSalt = this.newSalt();
    const afterSalt = this.newSalt();
    const before = event.before ?? "";
    const diff = unifiedDiff(before, event.after);

    return {
      schema: "cool.change.v2",
      record_id: this.newId(),
      time,
      change: {
        kind: event.changeKind,
        ref: event.ref,
        environment: event.environment,
        before_hash: event.before === undefined ? null : saltedCommit(beforeSalt, before),
        before_salt: event.before === undefined ? null : beforeSalt,
        after_hash: saltedCommit(afterSalt, event.after),
        after_salt: afterSalt,
        diff_hash: mhSha256(utf8(diff)),
        actor: event.actor,
        approval: this.decide(event),
      },
      runtime: this.runtime,
    };
  }
}
