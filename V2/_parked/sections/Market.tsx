"use client";

import { Station, Reveal, Glass, MonoTag } from "@/components/ui";
import clsx from "clsx";

const WEDGE = ["SDK", "Networks", "Compliance", "Enterprise", "Government"];

const NUMBERS = [
  { v: "$15.8B", k: "AI observability & governance market by 2030" },
  { v: "$3–5B", k: "regulated-AI verification segment" },
  { v: "$15–40M", k: "near-term wedge revenue path" },
];

const MILESTONES = [
  { t: "v0", d: "Signed receipts + offline verifier", now: true },
  { t: "MVP", d: "End-to-end verifiable inference on Phala" },
  { t: "Reference integration", d: "First design partners in regulated AI" },
  { t: "Enterprise", d: "Compliance tier, witness network" },
  { t: "Government", d: "The evidentiary standard" },
];

export default function Market() {
  return (
    <Station
      id="market"
      layer="03 · DUE DILIGENCE"
      station="§24+§17 · Business model"
      title="How the wedge expands."
      sub="Consumption pricing: per-attested-inference fees, a 3–5× premium over standard inference — because the alternative is a compliance team auditing AI decisions by hand."
    >
      <Reveal>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[13px]">
          {WEDGE.map((w, i) => (
            <span key={w} className="flex items-center gap-2">
              <span
                className={clsx(
                  "rounded-lg border px-3 py-1.5",
                  i === 0 ? "border-verify/50 bg-verify/10 text-verify" : "border-line text-fog",
                )}
              >
                {w}
              </span>
              {i < WEDGE.length - 1 && <span className="text-mist">→</span>}
            </span>
          ))}
        </div>
      </Reveal>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {NUMBERS.map((n, i) => (
          <Reveal key={n.v} delay={i * 0.08}>
            <Glass className="h-full p-3.5 text-center">
              <p className="display text-[clamp(1.2rem,4.5vw,1.9rem)] text-verify">{n.v}</p>
              <p className="mt-1 text-[10px] leading-snug text-mist sm:text-[11px]">{n.k}</p>
            </Glass>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <p className="mt-10 mb-3 font-mono text-[11px] tracking-[0.18em] text-mist uppercase">
          §17 · Where we are, publicly
        </p>
        <div className="space-y-0">
          {MILESTONES.map((m, i) => (
            <div key={m.t} className="relative flex gap-4 pb-5 pl-1 last:pb-0">
              {i < MILESTONES.length - 1 && (
                <span className="absolute top-5 left-[7.5px] h-full w-px bg-line" aria-hidden />
              )}
              <span
                className={clsx(
                  "relative mt-1 size-3.5 shrink-0 rounded-full border",
                  m.now
                    ? "border-verify bg-verify shadow-[0_0_12px_rgba(88,166,255,0.7)]"
                    : "border-line bg-panel",
                )}
                aria-hidden
              />
              <div>
                <p className="flex items-center gap-2 font-mono text-sm text-white">
                  {m.t}
                  {m.now && <MonoTag tone="verify">we are here</MonoTag>}
                </p>
                <p className="text-xs text-mist">{m.d}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <p className="mt-8 font-mono text-[11px] leading-relaxed text-mist">
          §22 · Benchmarks — latency overhead, verification time, receipt size:{" "}
          <span className="text-mock">published when they&rsquo;re real.</span>{" "}
          No projected numbers on this site.
        </p>
      </Reveal>
    </Station>
  );
}
