import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The investor gate, enforced where enforcement is possible: on the server.
 *
 * WHAT WAS WRONG BEFORE
 *
 * The gate used to be a client component that received the protected sections
 * as `children`. React renders those children on the server and serialises them
 * into the RSC flight payload that ships inside the HTML — whether or not the
 * component chooses to render them. So `curl /investors | grep pre-seed` hit,
 * with no passcode, on a page whose whole purpose was to withhold that string.
 * The gate hid the material from a reader's eyes and from nothing else. An
 * audit confirmed it against the built output: `#ask` absent from the DOM,
 * "₹1 Cr pre-seed — SAFE, ₹10 Cr post-money cap" present in the response body.
 *
 * The old file was honest that it was "not a security boundary" and that
 * `noindex` was doing the real work. That was true, and it was not enough:
 * `noindex` is a request to well-behaved crawlers, and the raise terms were
 * being handed to anyone who typed the URL.
 *
 * THE RULE NOW
 *
 * Gated means the bytes are not sent. Not hidden, not collapsed, not
 * `display:none` — not serialised at all. The protected sections are server
 * components that are never rendered unless this module says the request is
 * allowed, so an unauthorised response cannot contain them in HTML, in the
 * flight payload, or anywhere else. The proof is a grep against the response of
 * an ungated fetch, and it is recorded in QA_REPORT.md.
 *
 * WHAT THIS IS AND IS NOT
 *
 * It is a shared-passcode door: one secret, held on the server, handed out on a
 * call. It is not user accounts, not sessions, not authorisation. For a pitch
 * that five people read, a login table would be theatre. What it does buy —
 * and what the old gate did not — is that the material is not in the response
 * until someone proves they were told the passcode.
 *
 * The passcode lives in `INVESTOR_PASSCODE` and is never committed. If it is
 * unset the module FAILS CLOSED: nothing unlocks, and the page still offers
 * "Request access", which is the path most readers use anyway. A missing
 * environment variable can therefore only ever be a lockout, never a leak.
 *
 * `noindex` stays on both routes. It is now defence in depth rather than the
 * only thing standing up.
 */

/** Session cookie. Scoped to /investors — it has no business anywhere else. */
export const ACCESS_COOKIE = "cool_investor_access";

/**
 * The shared passcode, or null when unconfigured.
 *
 * Read through a function rather than captured at module load so that a
 * deployment which sets the variable does not need a rebuild to take effect.
 */
function secret(): string | null {
  const raw = process.env.INVESTOR_PASSCODE?.trim();
  return raw && raw.length > 0 ? raw : null;
}

/** True when a passcode is configured at all. Drives the form's copy, not access. */
export function passcodeConfigured(): boolean {
  return secret() !== null;
}

/**
 * The cookie's value: a keyed digest of the secret, never the secret.
 *
 * Two properties matter. The cookie cannot be read back into the passcode, so a
 * stolen browser profile does not hand over the thing shared on calls. And
 * rotating `INVESTOR_PASSCODE` changes the digest, which invalidates every
 * cookie already issued — rotation actually revokes, instead of leaving old
 * sessions quietly valid.
 */
function accessToken(key: string): string {
  return createHmac("sha256", key).update("cool.investor.access.v1").digest("hex");
}

/** Constant-time compare over fixed-length digests, so length never leaks either. */
function sameSecret(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cool.investor.compare.v1").update(a).digest();
  const hb = createHmac("sha256", "cool.investor.compare.v1").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Does the passcode match?
 *
 * Case- and whitespace-insensitive, because the old gate was and this moves
 * enforcement without moving the UX. Always false when unconfigured.
 */
export function verifyPasscode(input: string): boolean {
  const key = secret();
  if (key === null) return false;
  return sameSecret(input.trim().toLowerCase(), key.trim().toLowerCase());
}

/** The cookie value to issue on a successful unlock, or null when unconfigured. */
export function issuedToken(): string | null {
  const key = secret();
  return key === null ? null : accessToken(key);
}

/**
 * Is THIS request allowed to see the material?
 *
 * Calling this makes the route dynamic, which is the point: a statically
 * prerendered page cannot make a per-request access decision, and a build-time
 * decision is what put the raise terms in a static HTML file in the first
 * place. The cost is that /investors renders per request. That is the correct
 * trade for a page five people read.
 */
export async function hasInvestorAccess(): Promise<boolean> {
  // Read the cookie FIRST, before any early return. `cookies()` is what tells
  // Next this render depends on the request; short-circuiting above it means a
  // build with no passcode configured never touches it, Next prerenders the
  // locked page to static HTML, and that file then gets served forever — so a
  // deployment that supplies INVESTOR_PASSCODE at runtime rather than at build
  // time could never be unlocked by anyone. The pages also declare
  // `force-dynamic`; this ordering is the belt to that pair of braces.
  const presented = (await cookies()).get(ACCESS_COOKIE)?.value;
  const expected = issuedToken();
  if (expected === null || !presented) return false;
  return sameSecret(presented, expected);
}
