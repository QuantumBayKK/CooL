import { canonicalCbor } from "./canonical.js";
import { concatBytes } from "./codec.js";
import { mhSha256, multihashDigest } from "./multihash.js";
/** Strip the detached signature, leaving the hashed inference core. */
export function coreOf(record) {
    // Destructuring is the point: `signature` must be dropped, not read. The core
    // is what gets hashed, and including the signature would make the binding
    // hash depend on itself.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { signature, ...core } = record;
    return core;
}
/**
 * Compute `binding_hash = mh:sha256(canonicalCBOR(core))`.
 * Deterministic over the core's logical content (CDE canonicalization).
 */
export function bindingHash(core) {
    return mhSha256(canonicalCbor(core));
}
/**
 * The exact message that is hybrid-signed: `canonicalCBOR(core) ‖ binding_digest`.
 * The 32-byte binding digest is appended so the signature commits to the
 * commitment as well as the raw core bytes.
 */
export function recordSigningMessage(core, binding) {
    return concatBytes(canonicalCbor(core), multihashDigest(binding));
}
/**
 * The transparency-log leaf input for a record: the 32-byte digest referenced
 * by its `binding_hash`. A verifier recomputes this from the (verified) core,
 * so log inclusion is bound to the same bytes the signature seals.
 */
export function recordLeafData(binding) {
    return multihashDigest(binding);
}
/** Reduce an STH to the core fields covered by its signature and witnesses. */
export function sthCore(sth) {
    return {
        log_id: sth.log_id,
        tree_size: sth.tree_size,
        root_hash: sth.root_hash,
        timestamp: sth.timestamp,
    };
}
/** The exact message signed over an STH: `canonicalCBOR(sthCore)`. */
export function sthSigningMessage(core) {
    return canonicalCbor(core);
}
//# sourceMappingURL=record.js.map