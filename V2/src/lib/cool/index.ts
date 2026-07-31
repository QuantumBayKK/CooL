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
export { Cool } from "./cool";
export type {
  BackendResult,
  CompleteRequest,
  CompleteResult,
  CoolOptions,
  ModelBackend,
  ModelBackendArgs,
} from "./cool";
export { verifyReceipt } from "./verify";
export { generateKeypair, directoryFromKeypair, mergeDirectories } from "./keys";
export { hybridSign, hybridVerify, SIGNATURE_ALG } from "./sign";
export { canonicalCbor, jsonProjection } from "./canonical";
export { bindingHash, coreOf, recordSigningMessage, recordLeafData } from "./record";
export { mhSha256, multihashDigest, isMultihash } from "./multihash";
export { randomSalt, saltedCommit, sha256Bytes } from "./hash";
export { MemoryLog } from "./log-memory";
export {
  leafHash,
  nodeHash,
  merkleRoot,
  inclusionProof,
  verifyInclusion,
  consistencyProof,
  verifyConsistency,
} from "./merkle";
export { RECEIPT_SCHEMA } from "./schema";
export * from "./types";
