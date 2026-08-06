import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { EncryptJWT, jwtDecrypt } from "jose";

/**
 * Investor session handling.
 *
 * The session is carried in two coupled halves, and both must agree:
 *
 *   1. An encrypted JWT (JWE, A256GCM) in an HttpOnly cookie. It holds the
 *      session id and the opaque token. Encrypted rather than merely signed
 *      because a signed JWT is readable by anyone who has the cookie — and a
 *      cookie on an investor's laptop is exactly the thing we should assume is
 *      readable by whoever borrows that laptop.
 *
 *   2. A row in `investor_sessions` holding the SHA-256 of that opaque token.
 *
 * Half 1 alone proves nothing: revoking a code revokes the row, and the cookie
 * stops working immediately. Half 2 alone is not enough either: the row is
 * keyed by a hash, so a database dump does not yield a usable cookie. This is
 * what makes "revoke and it is gone" true, which a stateless JWT cannot do.
 *
 * The cookie is deliberately NOT the Supabase auth cookie. Investors do not
 * have Supabase accounts — issuing them one would create a `authenticated`
 * principal that RLS might one day grant something to, which is the exact
 * blast radius this design avoids.
 */

const COOKIE = "cool_investor";
const ISSUER = "cool:investor-portal";
const AUDIENCE = "cool:investor";

/** 8 hours. Long enough for a diligence session, short enough to matter. */
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export interface SessionClaims {
  sid: string;
  /** The opaque token whose SHA-256 is stored server-side. */
  tok: string;
}

/**
 * The AES-256-GCM key, derived from `INVESTOR_SESSION_SECRET`.
 *
 * SHA-256 of the secret gives exactly the 32 bytes A256GCM needs, so an
 * operator can set any sufficiently long passphrase rather than having to
 * produce base64 of exactly 32 bytes — a requirement that in practice gets
 * satisfied by pasting something too short.
 *
 * The length check is enforced rather than advised: a 12-character secret
 * hashed to 32 bytes is still a 12-character secret.
 */
function key(): Uint8Array {
  const secret = process.env.INVESTOR_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "Missing INVESTOR_SESSION_SECRET. Generate one with " +
        "`node -e \"console.log(require('crypto').randomBytes(32).toString('base64url'))\"`.",
    );
  }
  if (secret.length < 32) {
    throw new Error(
      "INVESTOR_SESSION_SECRET must be at least 32 characters. " +
        "Hashing a short secret to 32 bytes does not make it strong.",
    );
  }
  return new Uint8Array(createHash("sha256").update(secret, "utf8").digest());
}

/** A fresh opaque session token, and the digest to store against it. */
export function mintToken(): { token: string; hash: Buffer } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: createHash("sha256").update(token, "utf8").digest() };
}

export function hashToken(token: string): Buffer {
  return createHash("sha256").update(token, "utf8").digest();
}

/** Encrypt claims into the cookie value. */
export async function sealSession(claims: SessionClaims): Promise<string> {
  return new EncryptJWT({ ...claims })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .encrypt(key());
}

/** Decrypt and validate. Returns null on anything wrong — never throws to a route. */
export async function openSession(
  value: string,
): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtDecrypt(value, key(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const sid = payload.sid;
    const tok = payload.tok;
    if (typeof sid !== "string" || typeof tok !== "string") return null;
    return { sid, tok };
  } catch {
    // Expired, tampered, wrong key, or garbage. All are "not signed in", and
    // distinguishing them for the caller would leak which one to an attacker.
    return null;
  }
}

/* ── cookie plumbing ──────────────────────────────────────────────────────── */

function cookieOptions() {
  return {
    httpOnly: true,
    // Secure is skipped on plain-HTTP localhost, because a Secure cookie is
    // simply not stored there and the portal would appear broken in dev. Any
    // non-localhost deployment gets it.
    secure: process.env.NODE_ENV === "production",
    // `strict` and not `lax`: there is no legitimate cross-site navigation into
    // the portal. A magic link would need `lax`; an invite code typed into a
    // form does not.
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function setSessionCookie(claims: SessionClaims): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, await sealSession(claims), cookieOptions());
}

export async function readSessionCookie(): Promise<SessionClaims | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  return openSession(raw);
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

export const SESSION_COOKIE_NAME = COOKIE;
