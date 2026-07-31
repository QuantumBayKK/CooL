"use client";

import { Station, Reveal, Glass } from "@/components/ui";
import Scroller from "@/components/Scroller";

const TRUSTS = [
  {
    n: "01",
    t: "The model",
    d: "Did they run the model they claimed — or a cheaper variant?",
  },
  {
    n: "02",
    t: "The weights",
    d: "The published weights — or a quietly fine-tuned version?",
  },
  {
    n: "03",
    t: "The output",
    d: "Untouched between the model's generation and your screen?",
  },
];

const STAKES = [
  "A radiologist supporting a cancer diagnosis",
  "A bank approving a mortgage",
  "A court accepting AI evidence",
  "A defense system identifying targets",
  "A government deciding welfare eligibility",
];

export default function Problem() {
  return (
    <Station
      id="problem"
      layer="01 · THE MOVIE"
      station="§00 · The problem"
      title={
        <>
          When AI decides and someone is harmed,{" "}
          <span className="text-fail">no one can prove what it did.</span>
        </>
      }
      sub="Every production AI workload runs on one of five companies' clouds. When you call their API, you trust three things you fundamentally cannot verify:"
    >
      <div className="grid gap-3">
        {TRUSTS.map((x, i) => (
          <Reveal key={x.n} delay={i * 0.08}>
            <Glass className="flex items-start gap-4 p-4">
              <span className="font-mono text-sm text-fail/80">{x.n}</span>
              <div>
                <p className="font-mono text-sm tracking-wide text-white">{x.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-mist">{x.d}</p>
              </div>
            </Glass>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <Scroller className="mt-8">
          {STAKES.map((s) => (
            <span
              key={s}
              className="shrink-0 snap-start rounded-full border border-line px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-mist"
            >
              {s}
            </span>
          ))}
        </Scroller>
        <p className="mt-8 text-base leading-relaxed text-fog">
          In every one of those, three things are true at once: the audit trail
          is critical, the regulator is watching, and{" "}
          <span className="text-white">
            &ldquo;the AI said so&rdquo; is not a defensible answer.
          </span>
        </p>
      </Reveal>
    </Station>
  );
}
