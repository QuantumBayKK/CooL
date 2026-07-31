"use client";

import { Slide } from "@/components/Slide";
import { Reveal, Lines, Mark, Note } from "@/components/ui";

/**
 * Slide 3 — the same six jobs, done by the system.
 *
 * Mirrors slide 2 exactly: same six rows, same order, now ticked and rewritten
 * in the past tense. Nobody has to be told what changed — the reader recognises
 * the list they were just shown and sees that it has already happened.
 *
 * That mirroring is the story beat. No terminal here, no architecture, no
 * cryptography: those arrive later, and only as evidence that we are the people
 * who can build this.
 */

const DONE = [
  ["Written up", "the change document, generated and versioned"],
  ["Approved", "the right people asked, their answers recorded"],
  ["Registered", "the governance system updated"],
  ["Announced", "risk owners told, where they already work"],
  ["Filed", "evidence sealed so it cannot be altered later"],
  ["Retained", "kept as long as the regulator requires"],
] as const;

export default function S03Solution() {
  return (
    <Slide
      id="solution"
      no="03"
      kicker="The solution"
      title="The same six jobs. Nobody does them."
      sub={
        <>
          CooL watches for changes to your AI and handles everything that
          follows — <Mark tone="live">before anyone would have started</Mark>.
        </>
      }
    >
      <Reveal>
        <Lines items={DONE} lead="tick" />
      </Reveal>

      <Reveal delay={0.14}>
        <Note tone="live">
          Done in under a second, every time. Nobody lifted a finger.
        </Note>
      </Reveal>
    </Slide>
  );
}
