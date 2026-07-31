"use client";

import { ArrowUpRight } from "lucide-react";
import { Slide } from "@/components/Slide";
import { Reveal } from "@/components/ui";
import { INVEST_MAILTO, MEETING_URL } from "@/components/Nav";

/**
 * Slide 13 — the ask, then the horizon.
 *
 * Terms are stated plainly and up front. The vision ladder is deliberately
 * three rungs: what CooL is now, what it becomes, and what it is if this works.
 */

const VISION: { horizon: string; claim: string }[] = [
  {
    horizon: "Near term",
    claim: "The automatic system of record for every AI change in the enterprise.",
  },
  {
    horizon: "Long term",
    claim:
      "The control plane for enterprise AI — every change, across every provider, documented, governed and provable.",
  },
  {
    horizon: "Ten years",
    claim:
      "The system of record for how the world's AI changes. The layer every AI change flows through.",
  },
];

export default function S13Ask() {
  return (
    <Slide
      id="ask"
      no="13"
      kicker="The ask"
      title="₹1 Crore pre-seed. SAFE, ₹10 Cr post-money cap."
      sub="A 12-month runway that buys: MVP → first paid pilots → recurring revenue → seed-ready traction."
      wide
    >
      <Reveal>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["₹1 Cr", "Pre-seed round"],
            ["SAFE", "₹10 Cr post-money cap"],
            ["12 months", "Runway to the seed"],
          ].map(([big, small]) => (
            <div
              key={small}
              className="relative overflow-hidden rounded-2xl border border-verify/40 bg-panel px-4 py-4 text-center shadow-[0_0_34px_rgba(88,166,255,0.2)]"
            >
              <span aria-hidden className="shimmer-ring absolute inset-0 rounded-2xl" />
              <p className="display relative text-[clamp(1.7rem,6vw,2.3rem)] leading-none text-ink">
                {big}
              </p>
              <p className="relative mt-2 font-mono text-[11.5px] tracking-[0.1em] text-mist uppercase">
                {small}
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.14}>
        <div className="mt-4 frost overflow-hidden rounded-2xl border border-line">
          {VISION.map((v, i) => (
            <div
              key={v.horizon}
              className={`flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:gap-4 sm:px-5 ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              <p className="w-full shrink-0 font-mono text-[11px] tracking-[0.14em] text-verify uppercase sm:w-28">
                {v.horizon}
              </p>
              <p className="min-w-0 text-[14px] leading-relaxed text-fog">
                {v.claim}
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.22}>
        {/* The end of the path, so it asks for exactly one thing. Email stays
            as a quiet fallback rather than a second button competing with it. */}
        <div className="mt-5">
          <a
            href={MEETING_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-verify-deep px-6 py-3.5 font-mono text-[13px] text-white shadow-[0_0_24px_rgba(9,105,218,0.45)] transition-shadow hover:shadow-[0_0_36px_rgba(9,105,218,0.8)] sm:w-auto"
          >
            Book a meeting <ArrowUpRight className="size-4" />
          </a>
          <p className="mt-2.5 font-mono text-[11.5px] leading-relaxed text-mist">
            Or email us directly —{" "}
            <a href={INVEST_MAILTO} className="text-verify hover:underline">
              northwindcipher@gmail.com
            </a>
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.3}>
        <p className="mt-6 text-center text-[15px] leading-relaxed font-semibold text-ink italic">
          CooL — every AI change: documented, governed and proven. Automatically.
        </p>
      </Reveal>
    </Slide>
  );
}
