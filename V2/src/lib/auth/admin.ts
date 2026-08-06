import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { EncryptJWT, jwtDecrypt } from "jose";

import { ADMIN_COOKIE_NAME as COOKIE } from "@/lib/auth/cookies";

/**
 * Admin session.
 *
 * A single shared passphrase rather than an account system, and that is a
 * deliberate choice for the size of the problem: there is one admin. An
 * accounts table, a password reset flow and an email sender are three new
 * attack surfaces and three new things to keep patched, in exchange for
 * distinguishing between one person and themselves.
 *
 * The trade is written down rather than assumed, and it has an explicit
 * expiry condition: the moment a second admin exists, this must become
 * Supabase Auth plus an allowlist. Sharing the passphrase is not the answer,
 * because a shared credential cannot be revoked for one holder and cannot
 * attribute an action to a person — and the audit log's value depends on both.
 *
 * Separate secret from the investor session on purpose. One secret for both
 * would mean an investor token and an admin token are forgeable from each
 * other, which turns a data-room leak into a full compromise.
 */


const ISSUER = "cool:admin";
const AUDIENCE = "cool:admin";

/** 2 hours. Shorter than the investor session — this one can mint credentials. */
export const ADMIN_TTL_SECONDS = 2 * 60 * 60;

function key(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be set and at least 32 characters.",
    );
  }
  return new Uint8Array(createHash("sha256").update(secret, "utf8").digest());
}

export function adminConfigured(): boolean {
  const pass = process.env.ADMIN_PASSPHRASE;
  return Boolean(pass && pass.length >= 24 && process.env.ADMIN_SESSION_SECRET);
}

/**
 * Constant-time passphrase check.
 *
 * Both sides are hashed to a fixed 32 bytes before comparison. `timingSafeEqual`
 * throws on a length mismatch, so comparing raw strings would leak the
 * passphrase length through an exception — and hashing first makes every
 * comparison the same width regardless of what was typed.
 */
export function checkPassphrase(input: string): boolean {
  const expected = process.env.ADMIN_PASSPHRASE;
  if (!expected || expected.length < 24) return false;

  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function setAdminCookie(): Promise<void> {
  const token = await new EncryptJWT({ role: "admin" })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${ADMIN_TTL_SECONDS}s`)
    .encrypt(key());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_TTL_SECONDS,
  });
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return false;

  try {
    const { payload } = await jwtDecrypt(raw, key(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function clearAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export { ADMIN_COOKIE_NAME } from "@/lib/auth/cookies";
