import "server-only";

import { headers } from "next/headers";

/**
 * Coarse request context for the audit trail.
 *
 * The audit log exists to answer operational questions — "was this code used
 * from two countries within an hour", "which documents did this investor open"
 * — and not to profile anybody. So every field here is deliberately blunt:
 *
 *   · IP is truncated to /24 (IPv4) or /48 (IPv6) before it is stored. That is
 *     enough to notice a code being shared across networks and not enough to
 *     identify a household. Storing a full IP would make the audit log itself
 *     personal data under GDPR/DPDP, which would then need a retention and
 *     erasure story — a cost with no matching benefit here.
 *
 *   · User agent is truncated to 180 characters. Long enough to name the
 *     browser and OS, short enough that a fingerprinting-grade string cannot
 *     be smuggled in.
 */

export interface RequestContext {
  ipPrefix: string | null;
  country: string | null;
  userAgent: string | null;
}

/**
 * Truncate an IP to its network prefix.
 *
 * Returns null for anything unparseable rather than storing a partial or
 * attacker-controlled string — `x-forwarded-for` is a client-settable header
 * and its contents must never be trusted as a literal.
 */
export function truncateIp(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // XFF is a comma-separated chain; the left-most entry is the original client
  // as reported by the first proxy. It is spoofable, which is precisely why
  // this value is only ever used as a rate-limit bucket and a forensic hint,
  // never as an authorisation input.
  const first = raw.split(",")[0]?.trim();
  if (!first) return null;

  if (first.includes(":")) {
    // IPv6 → /48, the first three hextets.
    const parts = first.split(":").filter(Boolean);
    if (parts.length < 3) return null;
    if (!parts.every((p) => /^[0-9a-fA-F]{1,4}$/.test(p))) return null;
    return `${parts.slice(0, 3).join(":")}::/48`;
  }

  const octets = first.split(".");
  if (octets.length !== 4) return null;
  if (!octets.every((o) => /^\d{1,3}$/.test(o) && Number(o) <= 255)) return null;
  return `${octets.slice(0, 3).join(".")}.0/24`;
}

export async function requestContext(): Promise<RequestContext> {
  const h = await headers();

  const ipPrefix =
    truncateIp(h.get("x-forwarded-for")) ?? truncateIp(h.get("x-real-ip"));

  // Set by Vercel/Cloudflare at the edge. Absent locally, which is correct —
  // an absent country is honest, and a guessed one would pollute the trail.
  const country =
    h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? null;

  const userAgent = h.get("user-agent")?.slice(0, 180) ?? null;

  return { ipPrefix, country, userAgent };
}

/**
 * The rate-limit bucket for an action.
 *
 * Keyed on the truncated IP, so a shared office NAT shares a bucket. That is
 * the correct trade for a portal with tens of users: the alternative — keying
 * on something the client controls — is not a rate limit at all.
 *
 * Falls back to a single global bucket when there is no usable IP, which makes
 * a header-stripping proxy fail closed rather than open.
 */
export function rateBucket(action: string, ctx: RequestContext): string {
  return `${action}:${ctx.ipPrefix ?? "unknown"}`;
}
