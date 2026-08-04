/**
 * Public type definitions for the CooL receipt model (`cool.receipt.v1`).
 *
 * Vendored verbatim from `cool-sdk` (Apache-2.0). These mirror the
 * authoritative JSON Schema in `cool-spec` (`receipt-format/receipt.schema.json`).
 * They describe the *shape* of a receipt; they do not, by themselves, prove
 * anything about its authenticity.
 */
/** A multihash-tagged SHA-256 digest, e.g. `mh:sha256:<64 hex chars>`. */
export type Multihash = `mh:sha256:${string}`;
/** A `hex:<hex>` encoded field (used for salts). */
export type HexField = `hex:${string}`;
/** A `base64:<b64>` encoded field (used for keys and signatures). */
export type Base64Field = `base64:${string}`;
/** The hybrid signature algorithm identifier used throughout CooL v1. */
export type SignatureAlg = "ml-dsa-65+ed25519";
/**
 * A hybrid signature block: a classical Ed25519 signature AND a
 * post-quantum ML-DSA-65 (FIPS 204) signature over the same message.
 * BOTH must verify for the signature to be considered valid.
 */
export interface SignatureBlock {
    readonly alg: SignatureAlg;
    readonly key_id: string;
    readonly ml_dsa: Base64Field;
    readonly ed25519: Base64Field;
}
/** A public key directory entry: the two public keys for a hybrid key id. */
export interface DirectoryEntry {
    readonly ml_dsa_pub: Base64Field;
    readonly ed25519_pub: Base64Field;
}
/** A key directory mapping key ids to their public keys (carried in the receipt). */
export type KeyDirectory = Readonly<Record<string, DirectoryEntry>>;
/** Timing block. `seq` is a monotone sequence number; `issued_at` is informational. */
export interface RecordTime {
    readonly issued_at: string;
    readonly seq: number;
}
/** Model identity. `weights_hash` is a salted commitment; `provider` is informational. */
export interface RecordModel {
    readonly id: string;
    readonly version: string;
    readonly weights_hash: Multihash;
    readonly provider: string;
}
/** Request commitments: salted hashes of the input and parameters. No plaintext. */
export interface RecordRequest {
    readonly input_hash: Multihash;
    readonly input_salt: HexField;
    readonly params_hash: Multihash;
}
/** Response commitments: a salted hash of the output. No plaintext. */
export interface RecordResponse {
    readonly output_hash: Multihash;
    readonly output_salt: HexField;
}
/**
 * Runtime/attestation block. In this build `mode` is always `"mock"`:
 * there is NO real hardware attestation. `tee_quote` is always null.
 */
export interface RecordRuntime {
    readonly tee_vendor: "none";
    readonly mode: "mock";
    readonly enclave_measurement: null;
    readonly tee_quote: null;
}
/**
 * The hashed core of an inference record (`cool.inference.v1`).
 * This is the exact object that is canonicalized (CDE CBOR) and hashed to
 * produce `binding_hash`. The signature is NOT part of the core.
 */
export interface InferenceCore {
    readonly schema: "cool.inference.v1";
    readonly record_id: string;
    readonly time: RecordTime;
    readonly model: RecordModel;
    readonly request: RecordRequest;
    readonly response: RecordResponse;
    readonly runtime: RecordRuntime;
}
/** A signed inference record: the core plus its detached hybrid signature. */
export interface SignedRecord extends InferenceCore {
    readonly signature: SignatureBlock;
}
/** A Merkle inclusion proof (RFC 6962 audit path). */
export interface Inclusion {
    readonly leaf_index: number;
    readonly tree_size: number;
    readonly audit_path: Multihash[];
}
/**
 * A witness co-signature on a Signed Tree Head.
 * Only `external: true` witnesses are counted toward any independence
 * threshold. A CooL self-signature (`external: false`) is shown but NEVER
 * counted as independent.
 */
export interface Witness {
    readonly id: string;
    readonly external: boolean;
    readonly alg: SignatureAlg;
    readonly ml_dsa: Base64Field;
    readonly ed25519: Base64Field;
}
/** A Signed Tree Head (RFC 6962 STH) with optional witness co-signatures. */
export interface STH {
    readonly log_id: string;
    readonly tree_size: number;
    readonly root_hash: Multihash;
    readonly timestamp: string;
    readonly signature: SignatureBlock;
    readonly witnesses: Witness[];
}
/** The hashed core of an STH (what the STH signature and witnesses sign). */
export interface STHCore {
    readonly log_id: string;
    readonly tree_size: number;
    readonly root_hash: Multihash;
    readonly timestamp: string;
}
/** Attestation block. Always `mock` in this build — no hardware quote exists. */
export interface Attestation {
    readonly mode: "mock";
    readonly note: string;
}
/** The full `cool.receipt.v1` envelope. Self-contained and offline-verifiable. */
export interface Receipt {
    readonly schema: "cool.receipt.v1";
    readonly record: SignedRecord;
    readonly binding_hash: Multihash;
    readonly inclusion: Inclusion | null;
    readonly sth: STH | null;
    readonly attestation: Attestation;
    readonly anchor: null;
    readonly key_directory: KeyDirectory;
}
/** A generated hybrid keypair plus its directory entry. */
export interface KeyPair {
    readonly keyId: string;
    readonly mlDsaSecret: Uint8Array;
    readonly mlDsaPublic: Uint8Array;
    readonly ed25519Secret: Uint8Array;
    readonly ed25519Public: Uint8Array;
    readonly directoryEntry: DirectoryEntry;
}
/** Per-domain verification status. */
export type DomainStatus = "pass" | "fail" | "absent" | "mock";
/** The result of checking a single trust domain. */
export interface DomainCheck {
    readonly status: DomainStatus;
    readonly detail: string;
}
/** The six trust-domain checks of a CooL verdict. */
export interface VerdictChecks {
    readonly binding: DomainCheck;
    readonly signature: DomainCheck;
    readonly inclusion: DomainCheck;
    readonly witnesses: DomainCheck;
    readonly attestation: DomainCheck;
    readonly anchor: DomainCheck;
}
/** A short, human-facing summary of the record being verified. */
export interface VerdictSubject {
    readonly model: string;
    readonly version: string;
    readonly issued_at: string;
    readonly record_id: string;
    readonly key_id: string;
}
/**
 * A structured verification verdict. `ok` is true ONLY when binding and
 * signature pass and inclusion is either valid or legitimately absent.
 * Mock/absent domains (attestation, anchor, witnesses) are reported honestly
 * and NEVER cause `ok` to be true on their own — and are never marked `pass`.
 */
export interface Verdict {
    readonly ok: boolean;
    readonly schema: "cool.receipt.v1";
    readonly subject: VerdictSubject | null;
    readonly checks: VerdictChecks;
    readonly reasons: string[];
}
/** Options for {@link verifyReceipt}. */
export interface VerifyOptions {
    /**
     * Minimum number of INDEPENDENT (external:true) witnesses required for the
     * witnesses domain to be considered satisfied. Default 0. In this build no
     * external witnesses exist, so the witnesses domain is reported as absent.
     */
    readonly witnessThreshold?: number;
}
