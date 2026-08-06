import { createHash, randomInt, timingSafeEqual } from "node:crypto";

/**
 * Invite code generation, normalisation and hashing.
 *
 * Format: `COOL-INV-XXXX-XXXX`
 *
 * The eight secret characters are drawn from a 32-symbol alphabet, so the code
 * carries 8 × log2(32) = 40 bits of entropy. Forty bits is not enough to resist
 * an offline attack, and it is not asked to: the code is only ever checked
 * online, against a database rate limiter that allows 5 attempts per 15 minutes
 * per IP. At that rate the expected time to find one live code among a handful
 * outstanding is measured in millennia.
 *
 * Forty bits is the ceiling for something a human retypes from an email without
 * making mistakes, and a code people mistype is a code people ask us to resend
 * over a less secure channel. The rate limiter is the control; the length is
 * the ergonomics.
 */

/**
 * Crockford base32 minus I, L, O and U.
 *
 * I/L/1 and O/0 are the pairs people confuse when reading a code off a screen
 * and typing it into a phone. U is dropped because excluding it removes most
 * accidental profanity from a random four-character group.
 */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export const CODE_PREFIX = "COOL-INV";

/** `COOL-INV-72JQ-A91K` */
export function generateCode(): string {
  const pick = () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${CODE_PREFIX}-${pick()}-${pick()}`;
}

/**
 * Normalise before hashing or comparing.
 *
 * Uppercases, strips everything outside the alphabet, and re-groups. This is
 * what makes `cool inv 72jq a91k`, `COOL-INV-72JQ-A91K` and a code pasted with
 * a trailing newline all resolve to the same hash — without which a correct
 * code fails and the investor believes we sent them a broken one.
 *
 * Returns null when the input cannot be a code, so callers can reject early
 * without a database round trip.
 */
export function normaliseCode(input: string): string | null {
  const cleaned = input.toUpperCase().replace(/[^0-9A-Z]/g, "");

  // Accept with or without the literal COOLINV prefix typed in.
  const body = cleaned.startsWith("COOLINV") ? cleaned.slice(7) : cleaned;

  if (body.length !== 8) return null;
  for (const ch of body) {
    if (!ALPHABET.includes(ch)) return null;
  }

  return `${CODE_PREFIX}-${body.slice(0, 4)}-${body.slice(4)}`;
}

/** The 4 characters an admin sees in the code list. Never more. */
export function codeHint(code: string): string {
  const normalised = normaliseCode(code);
  if (!normalised) throw new Error("codeHint called with an invalid code");
  return normalised.slice(9, 13);
}

/**
 * SHA-256 of the normalised code.
 *
 * Not bcrypt/argon2, and that is a considered choice rather than a shortcut.
 * Password hashing exists to make an offline dictionary attack expensive
 * against a low-entropy human-chosen secret. This is a 40-bit uniformly random
 * secret with no dictionary, and the attack surface is online only. A 100ms KDF
 * here would buy no meaningful resistance and would hand an attacker a cheap
 * CPU-exhaustion lever: 50 concurrent redemption attempts would saturate the
 * server, which is a worse outcome than the one it defends against.
 */
export function hashCode(code: string): Buffer {
  const normalised = normaliseCode(code);
  if (!normalised) throw new Error("hashCode called with an invalid code");
  return createHash("sha256").update(normalised, "utf8").digest();
}

/** Constant-time compare for two digests of equal length. */
export function digestsEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Postgres `bytea` wants `\x…` hex over the wire. */
export function toBytea(digest: Buffer): string {
  return `\\x${digest.toString("hex")}`;
}
