"use client";

import { Slide } from "@/components/Slide";
import { Reveal, Mark } from "@/components/ui";
import MarketCircles from "@/components/MarketCircles";

/**
 * Slide 7 — the market, with its working shown.
 *
 * The circles are area-proportional and every ring carries its own why, how and
 * source. The two laws underneath are the actual reason the market exists at
 * all, so they get equal weight to the numbers.
 */

const LAWS: { name: string; clause: string; detail: string; teeth: string }[] = [
  {
    name: "EU AI Act",
    clause: "Article 12",
    detail:
      "High-risk AI systems must automatically log events across their entire lifetime, for traceability and audit.",
    teeth: "Doing this by hand does not scale — the law effectively requires automation.",
  },
  {
    name: "India DPDP Rules",
    clause: "2025",
    detail:
      "Mandatory security logging, multi-year retention and independent audits for major data handlers.",
    teeth: "Penalties up to ₹250 crore per breach.",
  },
];

export default function S07Market() {
  return (
    <Slide
      id="market"
      no="07"
      kicker="Market"
      title="Regulation is turning “nice to have” into “legally required”."
      sub="And CooL is the layer that delivers it. Here is the sizing, and exactly how we got there."
      wide
    >
      <Reveal>
        <MarketCircles />
      </Reveal>

      <Reveal delay={0.16}>
        <p className="kicker mt-8 mb-3 text-[14px]">Why this becomes inevitable</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {LAWS.map((l) => (
            <div
              key={l.name}
              className="frost rounded-2xl border border-verify/25 px-4 py-4"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="font-mono text-[14px] font-semibold text-ink">
                  {l.name}
                </p>
                <span className="rounded-full border border-verify/40 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-verify">
                  {l.clause}
                </span>
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-fog">
                {l.detail}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-mist">
                <Mark tone="fail">{l.teeth}</Mark>
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.24}>
        <p className="mt-4 rounded-xl border border-verify/30 bg-verify/[0.07] px-4 py-3.5 text-[14.5px] leading-relaxed text-fog">
          Every one of these laws demands the same thing:{" "}
          <span className="font-semibold text-ink">
            provable, automated records of what the AI did.
          </span>{" "}
          That is exactly, and only, what CooL produces.
        </p>
      </Reveal>
    </Slide>
  );
}
