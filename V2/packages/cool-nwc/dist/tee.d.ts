/**
 * The published package entry point (`cool-nwc`).
 *
 * One import surface for both tiers, because a consumer should not have to know
 * which half of the library a symbol lives in:
 *
 *   • the v1 evidence core — canonicalization, hashing, hybrid signatures, the
 *     RFC 6962 log, and the `cool.receipt.v1` verifier;
 *   • the v2 confidential-compute tier — dstack, measurement-sealed keys,
 *     RA-TLS capture, quote binding and the `cool.receipt.v2` verifier.
 *
 * The two are additive rather than alternative: v2 records are v1 records that
 * also say where they were produced and which key the hardware attested. The
 * names never collide (v2 suffixes its receipt-shaped exports with `V2`), so a
 * single star-export is unambiguous.
 *
 * Nothing here makes a network call except the model backend a caller supplies
 * and, if configured, the quote verifier. There is no telemetry.
 */
export * from "./index.js";
export * from "./phala/index.js";
