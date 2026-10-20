/**
 * Verdict → display rows.
 *
 * The only path from a verifier verdict to pixels on the film-led site. The
 * rule it exists to enforce: a row reads PASS if and only if the verifier
 * returned `status: "pass"` for that domain. MOCK, SIMULATED and ABSENT keep
 * their own words, and the overall line never hides them — "VERIFIED" is only
 * printed when every domain passed; otherwise the limits are named.
 *
 * Accepts both the v1 verdict shape (`mock`) and v2 (`simulated`), so the same
 * display logic would serve a hardware receipt without a second code path.
 */

import type { Verdict } from "@/lib/cool/types";

export type DisplayState = "PASS" | "FAIL" | "MOCK" | "SIMULATED" | "ABSENT" | "UNVERIFIED";

export interface DomainRow {
  readonly domain: string;
  readonly state: DisplayState;
  readonly detail: string;
}

export interface VerdictView {
  readonly rows: readonly DomainRow[];
  /** Headline: never "VERIFIED" while any row is not PASS. */
  readonly headline: string;
  readonly ok: boolean;
  readonly failed: readonly string[];
  readonly limited: readonly string[];
}

export const DOMAIN_ORDER = [
  "binding",
  "signature",
  "inclusion",
  "witnesses",
  "attestation",
  "anchor",
] as const;

export function stateOf(status: string): DisplayState {
  switch (status) {
    case "pass":
      return "PASS";
    case "fail":
      return "FAIL";
    case "mock":
      return "MOCK";
    case "simulated":
      return "SIMULATED";
    case "absent":
      return "ABSENT";
    default:
      // Anything the verifier did not explicitly pass is not a pass.
      return "UNVERIFIED";
  }
}

export function viewVerdict(verdict: Pick<Verdict, "ok" | "checks">): VerdictView {
  const checks = verdict.checks as unknown as Record<string, { status: string; detail: string }>;
  const rows: DomainRow[] = DOMAIN_ORDER.map((domain) => {
    const c = checks[domain];
    return {
      domain,
      state: c ? stateOf(c.status) : "UNVERIFIED",
      detail: c?.detail ?? "not reported by the verifier",
    };
  });

  const failed = rows.filter((r) => r.state === "FAIL").map((r) => r.domain);
  const limited = rows
    .filter((r) => r.state !== "PASS" && r.state !== "FAIL")
    .map((r) => `${r.domain} ${r.state}`);

  let headline: string;
  if (!verdict.ok || failed.length > 0) {
    headline = `FAILED · ${failed.length || "?"} domain${failed.length === 1 ? "" : "s"} broken`;
  } else if (limited.length > 0) {
    headline = `CORE VERIFIED · ${limited.length} not proven here`;
  } else {
    headline = "VERIFIED · every domain passed";
  }

  return { rows, headline, ok: verdict.ok && failed.length === 0, failed, limited };
}
