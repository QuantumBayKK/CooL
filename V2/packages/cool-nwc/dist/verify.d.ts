import type { Verdict, VerifyOptions } from "./types.js";
/**
 * Verify a CooL receipt fully offline against the keys it carries.
 * Returns a structured {@link Verdict} — never a bare boolean. Never throws
 * on a malformed or tampered receipt; problems surface as failed domains.
 */
export declare function verifyReceipt(receipt: unknown, options?: VerifyOptions): Promise<Verdict>;
