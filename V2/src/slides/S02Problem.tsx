"use client";

import { Slide } from "@/components/Slide";
import { Reveal, Lines, Mark, Note } from "@/components/ui";

/**
 * Slide 2 — the problem, in one screen, without a technical word.
 *
 * The reader is as likely to be a compliance officer at a bank or a hospital as
 * an engineer, so the shell session that used to open this slide is gone: it
 * made the problem look like a developer's, when the people who feel it hardest
 * are the ones who own the audit.
 *
 * Six lines, centred, floating. That is the whole slide — the cost of it lands
 * on the next one rather than crowding this one off the screen.
 */

const CHORES = [
  ["Write it up", "a document explaining what changed, and why"],
  ["Get it approved", "chase security and compliance for sign-off"],
  ["Update the register", "log it in the governance system"],
  ["Tell the right people", "notify whoever owns the risk"],
  ["File the evidence", "store proof, in case an auditor asks"],
  ["Keep it for years", "retention rules say seven, sometimes ten"],
] as const;

export default function S02Problem() {
  return (
    <Slide
      id="problem"
      no="02"
      kicker="The problem"
      title="One change. Six jobs for a human."
      sub={
        <>
          Changing the AI takes a minute. Everything after it is done by hand,{" "}
          <Mark tone="fail">every single time</Mark>.
        </>
      }
    >
      <Reveal>
        <Lines items={CHORES} lead="count" />
      </Reveal>

      <Reveal delay={0.14}>
        <Note tone="fail">
          Spread across ten systems that don&apos;t talk to each other. Then it
          happens again tomorrow.
        </Note>
      </Reveal>
    </Slide>
  );
}
