import type { HexField, KeyPair, Multihash, Receipt } from "./types.js";
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
/**
 * A CooL client bound to a signing key and a model backend. Reusable across
 * many `complete()` calls; `seq` increments per record within one instance.
 */
export declare class Cool {
    private readonly signing;
    private readonly backend;
    private readonly logMode;
    private readonly logKey;
    private readonly memlog;
    private readonly provider;
    private readonly clock;
    private readonly newId;
    private readonly newSalt;
    private readonly nextSeq;
    constructor(options: CoolOptions);
    /** Entries currently in this client's in-memory transparency log. */
    get logSize(): number;
    /**
     * Run the backend and produce a signed receipt for the call.
     * Proves what was computed and that the record is unforged; proves nothing
     * about the quality or safety of the output.
     */
    complete(request: CompleteRequest): Promise<CompleteResult>;
}
