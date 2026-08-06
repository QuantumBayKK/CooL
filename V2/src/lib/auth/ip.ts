/**
 * IP truncation.
 *
 * Deliberately NOT marked `server-only`, unlike the rest of the auth layer: it
 * is a pure string function with no access to headers, cookies or secrets, and
 * gating it behind `server-only` makes it untestable outside a Next runtime.
 * A security helper nobody can unit-test is a security helper nobody has
 * checked.
 *
 * IP is truncated to /24 (IPv4) or /48 (IPv6) before it is ever stored. That is
 * enough to notice an invite code being used from two networks and not enough
 * to identify a household — which keeps the audit log out of the category of
 * personal data that would need its own retention and erasure story.
 */

/**
 * Truncate an IP to its network prefix.
 *
 * Returns null for anything unparseable rather than storing a partial or
 * attacker-controlled string. `x-forwarded-for` is a client-settable header, so
 * its contents must never be written through to a log line or a rate-limit key
 * without validation.
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
