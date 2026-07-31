"use client";

import { Slide } from "@/components/Slide";
import { Reveal, Note } from "@/components/ui";

/**
 * Slide 9 â€” the comparison, reduced to the only row that decides anything.
 *
 * A five-column capability matrix is unreadable on a phone and unnecessary on a
 * laptop: four of its five rows say the same thing in different words. This
 * keeps the four categories a buyer will actually name, and states in one line
 * what each of them cannot do.
 */

const RIVALS = [
  ["AI observability", "Langfuse, Datadog", "watches performance â€” proves nothing"],
  ["Governance & GRC", "Credo AI, OneTrust", "holds policies â€” doesn't see your changes"],
  ["Compliance automation", "Vanta, Drata", "covers your company â€” not your AI"],
  ["Build it yourself", "", "a team, a year, and it still isn't tamper-proof"],
] as const;

export default function S08Competition() {
  return (
    <Slide
      id="competition"
      no="08"
      kicker="Competition"
      title="Everyone watches AI. Nobody proves it."
      sub="Four categories claim part of this. None of them produce evidence that holds up across providers."
      wide
    >
      <Reveal>
        <div className="mx-auto w-full max-w-2xl">
          {RIVALS.map(([name, who, gap], i) => (
            <div
              key={name}
              className={`flex flex-col items-center gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-6 sm:text-left ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              <div className="shrink-0">
                <p className="text-[14.5px] font-semibold text-ink">{name}</p>
                {who ? (
                  <p className="font-mono text-[10.5px] text-mist">{who}</p>
                ) : null}
              </div>
              <p className="text-[13.5px] leading-snug text-fail/85 sm:text-right">
                {gap}
              </p>
            </div>
          ))}

          <div className="mt-1 border-t border-verify/40 py-3.5">
            <div className="flex flex-col items-center gap-0.5 sm:flex-row sm:justify-between sm:gap-6 sm:text-left">
              <p className="shrink-0 text-[15px] font-semibold text-verify">CooL</p>
              <p className="text-[13.5px] leading-snug text-live sm:text-right">
                captures every change, seals it, and proves it â€” across every
                provider
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.14}>
        <Note>
          Incumbents are tied to their own stack, so they cannot be the neutral
          referee. And every change adds to a record that would be lost if you
          left.
        </Note>
      </Reveal>
    </Slide>
  );
}
