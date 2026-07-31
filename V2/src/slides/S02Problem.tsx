"use client";

import { Slide } from "@/components/Slide";
import { Reveal, Mark } from "@/components/ui";

/**
 * Slide 2 — the problem, told as one Monday morning.
 *
 * The terminal that used to open this slide is gone. It made the problem look
 * like a developer's problem, when the people who feel it hardest are the ones
 * who own the audit — and half this deck's readers run compliance at a bank or
 * a hospital, not a repository.
 *
 * What replaces it is the same story in prose: the moment, then the six jobs it
 * creates, then what that costs. The hook is unchanged.
 */

const CHORES: [string, string][] = [
  ["Write it up", "a document explaining what changed, and why"],
  ["Get it approved", "chase security and compliance for sign-off"],
  ["Update the register", "log it in the governance system"],
  ["Tell the right people", "notify whoever owns the risk"],
  ["File the evidence", "store proof, in case an auditor ever asks"],
  ["Keep it for years", "retention rules say seven, sometimes ten"],
];

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
  ["Weeks", "of staff time burned every year", "on documentation nobody wanted to write"],
  ["Deals", "stalled in security review", "waiting for evidence that doesn't exist yet"],
  ["Nothing", "provable when something breaks", "no record of what shipped, or who signed off"],
];

export default function S02Problem() {
  return (
    <Slide
      id="problem"
      no="02"
      kicker="The problem"
      title="Every AI change drags weeks of manual work behind it — and it happens all day, every day."
      sub={
        <>
          The change itself takes a minute. Everything after it is done by hand,
          by a person, <Mark tone="fail">every single time</Mark>.
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
              Someone changes one line of a prompt.
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-fog">
              That was the easy part, and it is over in thirty seconds. What
              follows is the rest of somebody&apos;s afternoon.
            </p>
          </div>

          <div className="divide-y divide-line">
            {CHORES.map(([what, why], i) => (
              <div key={what} className="flex items-start gap-3.5 px-4 py-3 sm:px-5">
                <span className="mt-0.5 w-4 shrink-0 font-mono text-[11px] text-fail">
                  {i + 1}
                </span>
                <p className="min-w-0 text-[14px] leading-snug text-fog">
                  <span className="font-semibold text-ink">{what}</span> — {why}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-line px-4 py-3.5 sm:px-5">
            <p className="font-mono text-[11px] tracking-[0.16em] text-mist uppercase">
              Across ten systems that don&apos;t talk to each other
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
              Every one of them needs the same facts typed in again. Then Tuesday
              arrives, and it happens once more.
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
          And the EU AI Act and India&apos;s DPDP rules now demand provable
          records that the manual way simply cannot produce.
        </p>
      </Reveal>
    </Slide>
  );
}
