"use client";

import { Slide } from "@/components/Slide";
import { Reveal, Mark } from "@/components/ui";

/**
 * Slide 2 — the problem, told as one Monday morning.
 *
 * Written to survive skimming: the headline alone is the argument, the ten
 * tools are a visual count rather than a paragraph, and the three costs are the
 * only numbers anyone needs to carry to the next slide.
 */

const TOOLS = [
  "Confluence",
  "Jira",
  "ServiceNow",
  "Slack",
  "Git",
  "Spreadsheets",
  "Email",
  "Drive",
  "GRC tool",
  "Audit vault",
];

const COSTS: [string, string, string][] = [
  ["Weeks", "of engineering time burned every year", "on documentation nobody wanted to write"],
  ["Deals", "stalled in security review", "waiting for evidence that doesn't exist yet"],
  ["Nothing", "provable when something breaks", "no record of what shipped, or who signed off"],
];

export default function S02Problem() {
  return (
    <Slide
      id="problem"
      no="02"
      kicker="The problem"
      title="One prompt change takes 30 seconds. The paperwork behind it takes hours."
      sub={
        <>
          Then it happens again tomorrow. Every enterprise running AI is changing
          prompts, models and agents <Mark tone="fail">every single day</Mark> —
          and each change drags a long tail of manual work behind it.
        </>
      }
      wide
    >
      <Reveal>
        <div className="frost overflow-hidden rounded-2xl border border-line">
          <div className="border-b border-line px-4 py-3.5 sm:px-5">
            <p className="font-mono text-[11px] tracking-[0.16em] text-verify uppercase">
              Monday, 09:14
            </p>
            <p className="mt-1.5 text-[15px] leading-snug font-semibold text-ink">
              A developer edits one line of a prompt.
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-fog">
              That was the easy part. Now someone has to document it, get it
              approved, update the governance record, notify security, log it for
              compliance, and file the evidence in case an auditor ever asks.
            </p>
          </div>

          <div className="px-4 py-4 sm:px-5">
            <p className="font-mono text-[11px] tracking-[0.16em] text-mist uppercase">
              Across ten disconnected tools
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {TOOLS.map((t, i) => (
                <span
                  key={t}
                  className="rounded-full border border-line bg-panel/60 px-2.5 py-1 font-mono text-[11px] text-mist"
                  style={{ opacity: 1 - i * 0.045 }}
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-fog">
              Hours gone. Then Tuesday arrives.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {COSTS.map(([big, mid, small]) => (
            <div key={big} className="frost rounded-2xl border border-fail/25 px-4 py-4">
              <p className="display text-[clamp(1.7rem,5.5vw,2.2rem)] leading-none text-fail">
                {big}
              </p>
              <p className="mt-2 text-[14px] leading-snug font-semibold text-ink">{mid}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-mist">{small}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <p className="mt-4 rounded-xl border border-verify/30 bg-verify/[0.07] px-4 py-3.5 text-[14.5px] leading-relaxed text-fog">
          <span className="font-semibold text-ink">
            The faster they adopt AI, the worse it gets.
          </span>{" "}
          And regulators now demand provable records the manual way cannot produce.
        </p>
      </Reveal>
    </Slide>
  );
}
