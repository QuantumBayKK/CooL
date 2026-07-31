"use client";

import { Slide } from "@/components/Slide";
import { Reveal } from "@/components/ui";

/**
 * Slide 10 — go to market, as a single sentence with evidence under it.
 *
 * The motion renders as a four-step ladder because "free SDK → pilot → SaaS →
 * enterprise" is the whole strategy and it should be readable in two seconds.
 */

const MOTION = [
  { step: "01", name: "Free SDK", detail: "A developer installs it in under an hour." },
  { step: "02", name: "Paid pilot", detail: "One regulated workflow, set up with us." },
  { step: "03", name: "SaaS subscription", detail: "The team stops doing the paperwork." },
  { step: "04", name: "Enterprise licence", detail: "Org-wide, SSO, policy, audit-grade." },
];

const FACTS: [string, string][] = [
  [
    "Beachhead",
    "AI companies in fintech, health and legal — they lose deals waiting on security and compliance evidence.",
  ],
  [
    "Distribution",
    "Founder-led, plus the founder's multi-million-view developer audience seeding the open SDK.",
  ],
  [
    "Validation in hand",
    "Senior engineers at top fintech and confidential-computing firms confirming the need.",
  ],
  [
    "Timeline to revenue",
    "First paid pilots within 1–2 quarters; recurring revenue within 2–3.",
  ],
];

export default function S10GTM() {
  return (
    <Slide
      id="gtm"
      no="10"
      kicker="Go to market"
      title="Land where the pain is sharpest: regulated AI, blocked on security review."
      sub="These companies already know they have the problem — they are losing revenue to it this quarter."
      wide
    >
      <Reveal>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {MOTION.map((m, i) => (
            <div
              key={m.step}
              className={`frost relative rounded-2xl border px-4 py-4 ${
                i === MOTION.length - 1 ? "border-verify/40" : "border-line"
              }`}
            >
              <span className="font-mono text-[10.5px] tracking-[0.14em] text-verify">
                {m.step}
              </span>
              <p className="mt-1.5 text-[14.5px] font-semibold text-ink">{m.name}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-mist">{m.detail}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.14}>
        <div className="mt-4 frost overflow-hidden rounded-2xl border border-line">
          {FACTS.map(([label, detail], i) => (
            <div
              key={label}
              className={`flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:gap-4 sm:px-5 ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              <p className="w-full shrink-0 font-mono text-[11px] tracking-[0.14em] text-verify uppercase sm:w-44">
                {label}
              </p>
              <p className="min-w-0 text-[13.5px] leading-relaxed text-fog">
                {detail}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </Slide>
  );
}
