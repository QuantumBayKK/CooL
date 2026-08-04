"use client";

/**
 * The seven domains of a verdict, shown as seven separate answers.
 *
 * A single green tick would be a lie by compression. These domains fail
 * independently and mean different things — a record can be perfectly signed and
 * not logged, or logged and attested by simulated hardware — so the display
 * refuses to collapse them. `simulated` and `absent` get their own colour and
 * their own glyph, and neither is ever rendered as a pass.
 */
import { domainOrder } from "@/lib/cool/phala";
import type { DomainStatusV2, VerdictChecksV2, VerdictV2 } from "@/lib/cool/phala";
import { Lozenge, type Tone } from "../ui";

const STATUS: Record<DomainStatusV2, { tone: Tone; glyph: string; label: string }> = {
  pass: { tone: "success", glyph: "✓", label: "pass" },
  fail: { tone: "danger", glyph: "✕", label: "fail" },
  simulated: { tone: "teal", glyph: "◐", label: "simulated" },
  pending: { tone: "warn", glyph: "◔", label: "pending" },
  absent: { tone: "neutral", glyph: "·", label: "absent" },
  mock: { tone: "neutral", glyph: "·", label: "mock" },
};

const WHAT: Record<keyof VerdictChecksV2, string> = {
  binding: "the record's contents match its commitment",
  signature: "ML-DSA-65 and Ed25519 both verify",
  inclusion: "the leaf is in the log under a signed tree head",
  witnesses: "independent co-signatures on that tree head",
  attestation: "the quote chains to a hardware root",
  enclave: "the quote, the measurement and the signing key are one chain",
  anchor: "the tree head is anchored publicly",
};

export function VerdictGrid({ verdict, compact = false }: { verdict: VerdictV2 | null; compact?: boolean }) {
  if (!verdict) {
    return (
      <p className="text-[13px]" style={{ color: "var(--atl-muted)" }}>
        Not verified yet.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Lozenge tone={verdict.ok ? "success" : "danger"} glyph>
          {verdict.ok ? "receipt verifies" : "receipt rejected"}
        </Lozenge>
        <span className="text-[12px]" style={{ color: "var(--atl-muted)" }}>
          {verdict.subject?.tee ?? ""}
        </span>
      </div>

      <div
        className="divide-y rounded-[3px] border"
        style={{ borderColor: "var(--atl-border)", background: "var(--atl-surface)" }}
      >
        {domainOrder().map((domain) => {
          const check = verdict.checks[domain];
          const status = STATUS[check.status];
          return (
            <div key={domain} className="flex items-start gap-2.5 px-2.5 py-1.5">
              <span
                aria-hidden
                className="mt-[1px] w-3 shrink-0 text-center text-[12px] font-bold"
                style={{ color: `var(--atl-${status.tone === "success" ? "green" : status.tone === "danger" ? "red" : status.tone === "teal" ? "teal" : "muted"})` }}
              >
                {status.glyph}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[12.5px] font-semibold capitalize">{domain}</span>
                  <span className="text-[11px]" style={{ color: "var(--atl-muted)" }}>
                    {status.label}
                  </span>
                </div>
                <p
                  className={`text-[11.5px] leading-snug ${compact ? "line-clamp-1" : ""}`}
                  style={{ color: "var(--atl-muted)" }}
                  title={WHAT[domain]}
                >
                  {check.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {verdict.reasons.length > 0 && (
        <ul
          className="mt-2 space-y-0.5 rounded-[3px] border px-2.5 py-2 text-[11.5px]"
          style={{ borderColor: "var(--atl-red-bg)", background: "var(--atl-red-bg)", color: "var(--atl-red)" }}
        >
          {verdict.reasons.map((reason, index) => (
            <li key={index}>— {reason}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
