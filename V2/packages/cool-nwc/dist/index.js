/**
 * CooL SDK — vendored into the site so the live demo runs the REAL evidence
 * pipeline in the visitor's browser rather than a re-enactment of it.
 *
 * Source: github.com/KenidoesCode/cool-sdk + cool-verifier + cool-spec
 * (Apache-2.0, Northwind Cipher Pvt. Ltd.).
 *
 * The only deviation from upstream is `codec.ts`, whose hex/base64 helpers were
 * rewritten off Node's `Buffer` onto `btoa`/`atob` so they run in a browser.
 * The bytes are identical, so a receipt produced here verifies under the
 * published `cool-verifier` CLI and vice-versa.
 */
export { Cool } from "./cool.js";
export { verifyReceipt } from "./verify.js";
export { generateKeypair, directoryFromKeypair, mergeDirectories } from "./keys.js";
export { hybridSign, hybridVerify, SIGNATURE_ALG } from "./sign.js";
export { canonicalCbor, jsonProjection } from "./canonical.js";
export { bindingHash, coreOf, recordSigningMessage, recordLeafData } from "./record.js";
export { mhSha256, multihashDigest, isMultihash } from "./multihash.js";
export { randomSalt, saltedCommit, sha256Bytes } from "./hash.js";
export { MemoryLog } from "./log-memory.js";
export { leafHash, nodeHash, merkleRoot, inclusionProof, verifyInclusion, consistencyProof, verifyConsistency, } from "./merkle.js";
export { RECEIPT_SCHEMA } from "./schema.js";
export * from "./types.js";
//# sourceMappingURL=index.js.map