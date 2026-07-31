"use client";

import { Slide } from "@/components/Slide";
import { Reveal } from "@/components/ui";

/**
 * Slide 12 — twelve months, as a timeline plus an allocation bar.
 *
 * The allocation renders as one stacked bar rather than a pie: at phone width a
 * pie with seven slices is unreadable, and a stacked bar keeps the proportions
 * honest and the labels legible.
 */

const PHASES: { window: string; goal: string; detail: string }[] = [
  {
    window: "0–2 months",
    goal: "Ship the MVP",
    detail:
      "Finish the hardware-attestation tier. SDK, CI integration, evidence log and dashboard in customers' hands.",
  },
  {
    window: "2–6 months",
    goal: "First paid pilots",
    detail:
      "Regulated-AI design partners running live, converting discovery into signed letters of intent.",
  },
  {
    window: "6–9 months",
    goal: "Recurring revenue",
    detail: "Pilots convert to SaaS subscriptions; first enterprise conversations open.",
  },
  {
    window: "9–12 months",
    goal: "Raise the seed",
    detail: "On real usage and real revenue, not on a deck.",
  },
];

const FUNDS: { label: string; pct: number; color: string }[] = [
  { label: "Human resources", pct: 30, color: "#58a6ff" },
  { label: "Engineering & R&D", pct: 25, color: "#3fb950" },
  { label: "Go-to-market", pct: 15, color: "#1f6feb" },
  { label: "Infrastructure", pct: 12, color: "#8b949e" },
  { label: "Compliance & legal", pct: 8, color: "#d29922" },
  { label: "Marketing", pct: 6, color: "#a371f7" },
  { label: "Buffer", pct: 4, color: "#484f58" },
];

export default function S12Funds() {
  return (
    <Slide
      id="funds"
      no="12"
      kicker="Roadmap & use of funds"
      title="₹1 Cr buys a 12-month runway to a seed round backed by revenue."
      wide
    >
      <Reveal>
        <div className="frost overflow-hidden rounded-2xl border border-line">
          {PHASES.map((p, i) => (
            <div
              key={p.window}
              className={`flex flex-col gap-1.5 px-4 py-3.5 sm:flex-row sm:gap-4 sm:px-5 ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              <p className="w-full shrink-0 font-mono text-[11.5px] tracking-[0.1em] text-verify sm:w-28">
                {p.window}
              </p>
              <div className="min-w-0">
                <p className="text-[14.5px] leading-snug font-semibold text-ink">
                  {p.goal}
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-fog">
                  {p.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.16}>
        <div className="frost mt-4 rounded-2xl border border-line px-4 py-4">
          <p className="font-mono text-[11px] tracking-[0.16em] text-verify uppercase">
            Use of funds
          </p>

          {/* one stacked bar — proportions stay honest at any width */}
          <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full">
            {FUNDS.map((f) => (
              <span
                key={f.label}
                className="h-full"
                style={{ width: `${f.pct}%`, background: f.color }}
                title={`${f.label} ${f.pct}%`}
              />
            ))}
          </div>

          <div className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
            {FUNDS.map((f) => (
              <div key={f.label} className="flex items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: f.color }}
                />
                <span className="min-w-0 flex-1 truncate text-[13px] text-fog">
                  {f.label}
                </span>
                <span className="shrink-0 font-mono text-[12px] text-ink">
                  {f.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </Slide>
  );
}
