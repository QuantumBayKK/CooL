/**
 * The `Cool` client: turn one model call into a signed, self-verifying receipt.
 * Vendored from `cool-sdk`.
 *
 * What this proves: each receipt produced here commits to the exact model id,
 * the salted hashes of the input and output, the parameters, and the time, and
 * seals that commitment with a hybrid (post-quantum + classical) signature. With
 * `log: "memory"` it also produces a real RFC 6962 inclusion proof and STH.
 * What this does NOT prove: that the output is correct, fair, unbiased, safe, or
 * policy-compliant; that any real TEE attested the run (runtime mode is always
 * `mock`); or that the record was independently witnessed or anchored.
 *
 * The SDK makes NO network calls of its own — the only outbound call is the
 * `backend` you supply. There is no telemetry.
 */
import { ulid } from "ulid";
import type {
  Attestation,
  HexField,
  Inclusion,
  InferenceCore,
  KeyDirectory,
  KeyPair,
  Multihash,
  Receipt,
  SignedRecord,
  STH,
} from "./types";
import { canonicalCbor } from "./canonical";
import { utf8 } from "./codec";
import { mhSha256 } from "./multihash";
import { randomSalt, saltedCommit } from "./hash";
import { generateKeypair, mergeDirectories } from "./keys";
import { hybridSign } from "./sign";
import { MemoryLog } from "./log-memory";
import { bindingHash, recordLeafData, recordSigningMessage } from "./record";

/** Arguments passed to a model backend. */
export interface ModelBackendArgs {
  /** Model identifier (without the `@version` suffix). */
  readonly model: string;
  /** Model version parsed from the `model@version` request, or `"0"` if absent. */
  readonly version: string;
  /** The raw prompt/input. Committed as a salted hash; never stored in plaintext. */
  readonly prompt: string;
  /** Inference parameters (e.g. temperature, seed). Committed via canonical hash. */
  readonly params: unknown;
}

/** What a model backend returns. */
export interface BackendResult {
  /** The model output. Committed as a salted hash; never stored in plaintext. */
  readonly output: string;
  /** Optional real commitment to the model weights. If omitted, a labelled mock is used. */
  readonly weightsHash?: Multihash;
}

/** A pluggable model backend: any OpenAI-compatible call or a local function. */
export type ModelBackend = (args: ModelBackendArgs) => Promise<BackendResult> | BackendResult;

/** Options for constructing a {@link Cool} client. */
export interface CoolOptions {
  /** The hybrid keypair used to sign records. */
  readonly signing: KeyPair;
  /** The model backend to invoke. The only outbound call the SDK makes. */
  readonly backend: ModelBackend;
  /**
   * `"memory"` attaches a real in-memory RFC 6962 inclusion proof + STH (for
   * demos and tests). `"none"` (default) produces a signature-only receipt.
   */
  readonly log?: "memory" | "none";
  /** Stable log id recorded in the STH (default `"demo"`). */
  readonly logId?: string;
  /**
   * The hybrid key that signs the STH. Defaults to a freshly generated key with
   * id `cool-log-<logId>-01`. Its public key is embedded so STHs verify offline.
   */
  readonly logKey?: KeyPair;
  /** Value recorded as `model.provider` (default `"mock-local"`). */
  readonly provider?: string;
  /** Clock returning an RFC 3339 timestamp (default `new Date().toISOString()`). */
  readonly clock?: () => string;
  /** Record-id generator (default ULID). Inject for deterministic vectors/tests. */
  readonly newId?: () => string;
  /** Salt generator (default 16 random bytes). Inject for deterministic vectors/tests. */
  readonly newSalt?: () => HexField;
  /** Monotone sequence-number generator (default an incrementing counter). */
  readonly seq?: () => number;
}

/** A request to {@link Cool.complete}. */
export interface CompleteRequest {
  /** Model reference as `id@version` (e.g. `acme/credit-scorer@2026.06.0`). */
  readonly model: string;
  /** The prompt/input. */
  readonly prompt: string;
  /** Inference parameters. */
  readonly params?: unknown;
}

/** The result of {@link Cool.complete}: the raw output and its receipt. */
export interface CompleteResult {
  readonly output: string;
  readonly receipt: Receipt;
}

const ATTESTATION: Attestation = { mode: "mock", note: "no hardware quote in v0" };

function parseModelRef(ref: string): { id: string; version: string } {
  const at = ref.lastIndexOf("@");
  if (at <= 0) return { id: ref, version: "0" };
  return { id: ref.slice(0, at), version: ref.slice(at + 1) };
}

/** Labelled mock weights commitment, used when a backend supplies none. */
function mockWeightsHash(id: string, version: string): Multihash {
  return mhSha256(utf8(`cool-mock-weights:${id}@${version}`));
}

/**
 * A CooL client bound to a signing key and a model backend. Reusable across
 * many `complete()` calls; `seq` increments per record within one instance.
 */
export class Cool {
  private readonly signing: KeyPair;
  private readonly backend: ModelBackend;
  private readonly logMode: "memory" | "none";
  private readonly logKey: KeyPair | null;
  private readonly memlog: MemoryLog | null;
  private readonly provider: string;
  private readonly clock: () => string;
  private readonly newId: () => string;
  private readonly newSalt: () => HexField;
  private readonly nextSeq: () => number;

  constructor(options: CoolOptions) {
    this.signing = options.signing;
    this.backend = options.backend;
    this.logMode = options.log ?? "none";
    this.provider = options.provider ?? "mock-local";
    this.clock = options.clock ?? (() => new Date().toISOString());
    this.newId = options.newId ?? (() => ulid());
    this.newSalt = options.newSalt ?? (() => randomSalt());

    let counter = 0;
    this.nextSeq = options.seq ?? (() => counter++);

    if (this.logMode === "memory") {
      const logId = options.logId ?? "demo";
      this.logKey = options.logKey ?? generateKeypair(`cool-log-${logId}-01`);
      this.memlog = new MemoryLog(logId, this.logKey);
    } else {
      this.logKey = null;
      this.memlog = null;
    }
  }

  /** Entries currently in this client's in-memory transparency log. */
  get logSize(): number {
    return this.memlog?.size ?? 0;
  }

  /**
   * Run the backend and produce a signed receipt for the call.
   * Proves what was computed and that the record is unforged; proves nothing
   * about the quality or safety of the output.
   */
  async complete(request: CompleteRequest): Promise<CompleteResult> {
    const { id, version } = parseModelRef(request.model);
    const params = request.params ?? {};

    const result = await this.backend({ model: id, version, prompt: request.prompt, params });
    const output = result.output;

    const inputSalt = this.newSalt();
    const outputSalt = this.newSalt();

    const core: InferenceCore = {
      schema: "cool.inference.v1",
      record_id: this.newId(),
      time: { issued_at: this.clock(), seq: this.nextSeq() },
      model: {
        id,
        version,
        weights_hash: result.weightsHash ?? mockWeightsHash(id, version),
        provider: this.provider,
      },
      request: {
        input_hash: saltedCommit(inputSalt, request.prompt),
        input_salt: inputSalt,
        params_hash: mhSha256(canonicalCbor(params)),
      },
      response: {
        output_hash: saltedCommit(outputSalt, output),
        output_salt: outputSalt,
      },
      runtime: { tee_vendor: "none", mode: "mock", enclave_measurement: null, tee_quote: null },
    };

    const binding = bindingHash(core);
    const signature = hybridSign(recordSigningMessage(core, binding), this.signing);
    const record: SignedRecord = { ...core, signature };

    let inclusion: Inclusion | null = null;
    let sth: STH | null = null;
    if (this.memlog) {
      const { leafIndex } = this.memlog.append(recordLeafData(binding));
      sth = this.memlog.buildSTH(this.clock());
      inclusion = {
        leaf_index: leafIndex,
        tree_size: sth.tree_size,
        audit_path: this.memlog.inclusionAuditPath(leafIndex),
      };
    }

    const directoryKeys: KeyPair[] = this.logKey ? [this.signing, this.logKey] : [this.signing];
    const key_directory: KeyDirectory = mergeDirectories(...directoryKeys);

    const receipt: Receipt = {
      schema: "cool.receipt.v1",
      record,
      binding_hash: binding,
      inclusion,
      sth,
      attestation: ATTESTATION,
      anchor: null,
      key_directory,
    };

    return { output, receipt };
  }
}
