"use client";

import { Station, Reveal, Glass } from "@/components/ui";
import ConceptStage from "@/components/ConceptStage";
import clsx from "clsx";

const ROWS: { claim: string; ev: string; href?: string; honest?: boolean }[] = [
  { claim: "One-line SDK", ev: "Live demo ↑", href: "#one-line" },
  { claim: "Post-quantum crypto", ev: "NIST FIPS 203 ↗", href: "https://csrc.nist.gov/pubs/fips/203/final" },
  { claim: "Offline verification", ev: "You just ran it ↑", href: "#verify" },
  { claim: "Append-only history", ev: "Transparency log ↑", href: "#verify" },
  { claim: "Operator resistance", ev: "Threat model ↑", href: "#trust" },
  { claim: "TEE integration", ev: "Honest status: mock → real", href: "#honesty", honest: true },
  { claim: "Vendor neutrality", ev: "Architecture ↑", href: "#pillars" },
  { claim: "Cross-network design", ev: "Integration map ↑", href: "#pillars" },
  { claim: "Performance", ev: "Benchmarks — when they're real", honest: true },
  { claim: "Roadmap", ev: "Public milestone tracker ↓", href: "#market" },
];

const COMPARE = [
  "Operator neutral",
  "Offline verify",
  "Post-quantum",
  "Independent",
  "Hardware bound",
  "Cross-network",
];

export default function Evidence() {
  return (
    <Station
      id="evidence"
      layer="03 · DUE DILIGENCE"
      station="§30 · The single most important page"
      title="Why should you trust CooL?"
      sub="You shouldn't — on our word. No claim on this site exists without evidence. Every row links to a live demo, a public spec, or an honest status."
      wide
    >
      <ConceptStage
        model="ledger"
        sectionId="evidence"
        finish="aluminium"
        caption="the permanent ledger"
      />
      <Reveal>
        <Glass className="divide-y divide-line overflow-hidden rounded-2xl">
          {ROWS.map((r) => {
            const inner = (
              <>
                <span className="font-mono text-[13px] text-white">{r.claim}</span>
                <span
                  className={clsx(
                    "shrink-0 text-right font-mono text-xs",
                    r.honest ? "text-mock" : "text-verify",
                  )}
                >
                  {r.ev}
                </span>
              </>
            );
            return r.href ? (
              <a
                key={r.claim}
                href={r.href}
                target={r.href.startsWith("http") ? "_blank" : undefined}
                rel={r.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-white/4"
              >
                {inner}
              </a>
            ) : (
              <div
                key={r.claim}
                className="flex items-center justify-between gap-3 px-4 py-3.5"
              >
                {inner}
              </div>
            );
          })}
        </Glass>
      </Reveal>

      {/* the honest boundary of every claim */}
      <Reveal delay={0.08}>
        <div className="mt-6 rounded-2xl border border-verify/25 bg-verify/5 p-4">
          <p className="font-mono text-[11px] tracking-[0.18em] text-verify uppercase">
            What a receipt does — and doesn&rsquo;t — prove
          </p>
          <p className="mt-2 text-sm leading-relaxed text-fog">
            A CooL receipt proves <span className="text-white">what was computed</span>:
            which model, which weights, which input, which output, when. It does{" "}
            <span className="text-white">not</span> prove the output is correct,
            fair, or safe. We sell evidence, not judgment.
          </p>
        </div>
      </Reveal>

      {/* §21 comparison */}
      <Reveal delay={0.12}>
        <p className="mt-10 mb-3 font-mono text-[11px] tracking-[0.18em] text-mist uppercase">
          §21 · Compared on the axes that matter
        </p>
        <Glass className="overflow-hidden rounded-2xl">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 border-b border-line px-4 py-2.5 font-mono text-[10px] tracking-wide text-mist uppercase">
            <span>Capability</span>
            <span className="w-12 text-center text-verify">CooL</span>
            <span className="w-12 text-center">Others</span>
          </div>
          {COMPARE.map((c) => (
            <div
              key={c}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 border-b border-line/50 px-4 py-2.5 last:border-0"
            >
              <span className="font-mono text-[13px] text-fog">{c}</span>
              <span className="w-12 text-center text-live">✓</span>
              <span className="w-12 text-center text-fail/70">✕</span>
            </div>
          ))}
        </Glass>
      </Reveal>
    </Station>
  );
}
