"use client";

import { Slide } from "@/components/Slide";
import { Reveal, Mark } from "@/components/ui";
import Terminal, { type TermLine } from "@/components/Terminal";

/**
 * Slide 2 — the problem, in the terminal where it starts.
 *
 * The headline is the deck's own line, kept verbatim because it is the sharpest
 * statement of the problem we have. Underneath it, the shell is doing the
 * persuading: a developer reads two familiar commands, then reads the list of
 * things that are now their afternoon, and recognises their own week.
 *
 * That recognition is the slide. The tool logos and the cost tiles are only
 * there to size what they have just recognised.
 */

const SESSION: readonly TermLine[] = [
  { kind: "out", text: "~/acme/ai-platform on  feat/adverse-action-reasons", tone: "dim" },
  { kind: "cmd", text: 'git commit -am "add reason codes to adverse-action prompt"' },
  { kind: "out", text: "[feat/adverse-action-reasons 4f2a1c9] add reason codes to adverse-action prompt", tone: "plain" },
  { kind: "out", text: " 2 files changed, 4 insertions(+), 1 deletion(-)", tone: "dim" },
  { kind: "cmd", text: "git push" },
  { kind: "out", text: "To github.com:acme/ai-platform.git", tone: "dim" },
  { kind: "out", text: "   9c1e40b..4f2a1c9  feat/adverse-action-reasons -> feat/adverse-action-reasons", tone: "dim" },
  { kind: "gap" },
  { kind: "out", text: "# 30 seconds of work. now the rest of your afternoon:", tone: "warn" },
  { kind: "out", text: "#   1. write the change doc in Confluence", tone: "dim" },
  { kind: "out", text: "#   2. open the Jira ticket, link the commit", tone: "dim" },
  { kind: "out", text: "#   3. chase security for sign-off", tone: "dim" },
  { kind: "out", text: "#   4. update the governance register", tone: "dim" },
  { kind: "out", text: "#   5. post it in #ai-governance", tone: "dim" },
  { kind: "out", text: "#   6. file the evidence for the auditor", tone: "dim" },
  { kind: "gap" },
  { kind: "out", text: "# then do it again tomorrow.", tone: "warn" },
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
      title="Every AI change drags weeks of manual work behind it — and it happens all day, every day."
      sub={
        <>
          The change itself takes thirty seconds. Everything after it is done by
          hand, by a person, <Mark tone="fail">every single time</Mark>.
        </>
      }
      wide
    >
      <Reveal>
        <Terminal lines={SESSION} title="acme/ai-platform — zsh" />
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-4 frost rounded-2xl border border-line px-4 py-4 sm:px-5">
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
            None of them know about each other. All of them need the same facts
            typed in again.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.16}>
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

      <Reveal delay={0.22}>
        <p className="mt-4 rounded-xl border border-verify/30 bg-verify/[0.07] px-4 py-3.5 text-[14.5px] leading-relaxed text-fog">
          <span className="font-semibold text-ink">
            The faster they adopt AI, the worse it gets.
          </span>{" "}
          And regulators now demand provable records the manual way cannot
          produce.
        </p>
      </Reveal>
    </Slide>
  );
}
