/**
 * Inference record construction and the bytes that get hashed and signed.
 * Vendored verbatim from `cool-sdk`.
 *
 * What this proves: the `binding_hash` is a deterministic commitment to the
 * EXACT core of the record (model, salted input/output hashes, params, runtime,
 * timing). Recomputing it detects any change to the core. The signing message
 * binds the signature to both the core bytes and that commitment.
 * What this does NOT prove: that the model actually produced the output, only
 * that this record claims so and is internally consistent and sealed.
 */
import type { InferenceCore, Multihash, SignedRecord, STH, STHCore } from "./types.js";
/** Strip the detached signature, leaving the hashed inference core. */
export declare function coreOf(record: SignedRecord): InferenceCore;
/**
 * Compute `binding_hash = mh:sha256(canonicalCBOR(core))`.
 * Deterministic over the core's logical content (CDE canonicalization).
 */
export declare function bindingHash(core: InferenceCore): Multihash;
/**
 * The exact message that is hybrid-signed: `canonicalCBOR(core) ‖ binding_digest`.
 * The 32-byte binding digest is appended so the signature commits to the
 * commitment as well as the raw core bytes.
 */
export declare function recordSigningMessage(core: InferenceCore, binding: Multihash): Uint8Array;
/**
 * The transparency-log leaf input for a record: the 32-byte digest referenced
 * by its `binding_hash`. A verifier recomputes this from the (verified) core,
 * so log inclusion is bound to the same bytes the signature seals.
 */
export declare function recordLeafData(binding: Multihash): Uint8Array;
/** Reduce an STH to the core fields covered by its signature and witnesses. */
export declare function sthCore(sth: STH): STHCore;
/** The exact message signed over an STH: `canonicalCBOR(sthCore)`. */
export declare function sthSigningMessage(core: STHCore): Uint8Array;
