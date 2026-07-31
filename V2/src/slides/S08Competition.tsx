"use client";

import { Slide } from "@/components/Slide";
import { Reveal } from "@/components/ui";

/**
 * Slide 9 — the comparison table, built to be read on a phone.
 *
 * A five-column table is unreadable at 390px, so the same data renders as a
 * horizontally scrollable grid on desktop and as per-capability cards on phone.
 * Same content, no truncation, no pinch-zoom.
 */

type Mark = "yes" | "no" | "partial" | "manual" | "na";

const COLUMNS: { key: string; name: string; sub: string }[] = [
  { key: "obs", name: "AI observability", sub: "Langfuse, Datadog" },
  { key: "grc", name: "AI governance / GRC", sub: "Credo AI, OneTrust" },
  { key: "ca", name: "Compliance automation", sub: "Vanta, Drata" },
  { key: "diy", name: "Build in-house", sub: "" },
  { key: "cool", name: "CooL", sub: "" },
];

const ROWS: { capability: string; marks: Record<string, Mark> }[] = [
  {
    capability: "Auto-captures every AI change",
    marks: { obs: "partial", grc: "no", ca: "no", diy: "manual", cool: "yes" },
  },
  {
    capability: "Tamper-proof, provable evidence",
    marks: { obs: "no", grc: "no", ca: "no", diy: "no", cool: "yes" },
  },
  {
    capability: "Works across every provider (neutral)",
    marks: { obs: "no", grc: "partial", ca: "partial", diy: "na", cool: "yes" },
  },
  {
    capability: "Proves which model actually ran",
    marks: { obs: "no", grc: "no", ca: "no", diy: "no", cool: "yes" },
  },
  {
    capability: "Zero manual effort",
    marks: { obs: "no", grc: "no", ca: "partial", diy: "no", cool: "yes" },
  },
];

const MARK_STYLE: Record<Mark, { glyph: string; cls: string; label: string }> = {
  yes: { glyph: "✓", cls: "text-live", label: "Yes" },
  no: { glyph: "✕", cls: "text-fail/80", label: "No" },
  partial: { glyph: "◐", cls: "text-[#d29922]", label: "Partial" },
  manual: { glyph: "◑", cls: "text-mock", label: "Manual" },
  na: { glyph: "—", cls: "text-mist", label: "—" },
};

function Cell({ mark }: { mark: Mark }) {
  const s = MARK_STYLE[mark];
  return (
    <span className={`font-mono text-[14px] ${s.cls}`} title={s.label}>
      {s.glyph}
    </span>
  );
}

export default function S08Competition() {
  return (
    <Slide
      id="competition"
      no="08"
      kicker="Competition & moat"
      title="Everyone tracks AI. Nobody proves it — across providers, tamper-proof."
      wide
    >
      {/* desktop: the table */}
      <Reveal>
        <div className="frost hidden overflow-x-auto rounded-2xl border border-line md:block">
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3 text-left font-mono text-[10.5px] tracking-[0.12em] text-mist uppercase">
                  Capability
                </th>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className={`px-3 py-3 text-center font-mono text-[10.5px] tracking-[0.1em] uppercase ${
                      c.key === "cool" ? "bg-verify/[0.08] text-verify" : "text-mist"
                    }`}
                  >
                    {c.name}
                    {c.sub ? (
                      <span className="mt-0.5 block text-[9.5px] normal-case opacity-70">
                        {c.sub}
                      </span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.capability} className="border-b border-line/70 last:border-b-0">
                  <td className="px-4 py-3 text-[13.5px] leading-snug text-fog">
                    {r.capability}
                  </td>
                  {COLUMNS.map((c) => (
                    <td
                      key={c.key}
                      className={`px-3 py-3 text-center ${
                        c.key === "cool" ? "bg-verify/[0.06]" : ""
                      }`}
                    >
                      <Cell mark={r.marks[c.key]!} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      {/* phone: one card per capability */}
      <div className="space-y-2.5 md:hidden">
        {ROWS.map((r, i) => (
          <Reveal key={r.capability} delay={i * 0.05}>
            <div className="frost rounded-xl border border-line px-3.5 py-3">
              <p className="text-[13.5px] leading-snug font-semibold text-ink">
                {r.capability}
              </p>
              <div className="mt-2 space-y-1">
                {COLUMNS.map((c) => (
                  <div
                    key={c.key}
                    className={`flex items-center justify-between gap-2 rounded px-2 py-1 ${
                      c.key === "cool" ? "bg-verify/[0.1]" : ""
                    }`}
                  >
                    <span
                      className={`min-w-0 truncate font-mono text-[11.5px] ${
                        c.key === "cool" ? "text-verify" : "text-mist"
                      }`}
                    >
                      {c.name}
                    </span>
                    <Cell mark={r.marks[c.key]!} />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.3}>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="frost rounded-2xl border border-line px-4 py-4">
            <p className="font-mono text-[11px] tracking-[0.16em] text-verify uppercase">
              Why incumbents can&apos;t copy it
            </p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-fog">
              They&apos;re tied to their own stack, so they cannot be the neutral,
              cross-provider referee. And tamper-proof evidence is simply not in
              their DNA — it is a cryptography problem, not a dashboard feature.
            </p>
          </div>
          <div className="frost rounded-2xl border border-verify/30 px-4 py-4">
            <p className="font-mono text-[11px] tracking-[0.16em] text-verify uppercase">
              Why the moat compounds
            </p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-fog">
              Every change adds to a verifiable lineage of the customer&apos;s whole
              AI estate. Ripping CooL out means losing years of provable history —
              which is exactly the thing regulators ask for.
            </p>
          </div>
        </div>
      </Reveal>
    </Slide>
  );
}
