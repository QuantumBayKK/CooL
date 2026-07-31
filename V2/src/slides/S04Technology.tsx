"use client";

import { Slide } from "@/components/Slide";
import { Reveal, Lines, Note } from "@/components/ui";

/**
 * Slide 4 — the technology, present only as credibility.
 *
 * Nobody buys this because of the cryptography. They buy it because the work
 * stops. So this slide does not explain how any of it works; it exists to
 * answer one question a cautious buyer asks silently — *are these the people
 * who can actually build it?* — and then gets out of the way.
 *
 * Each line therefore leads with what it guarantees, not with the mechanism.
 */

const GUARANTEES = [
  ["It can't slow you down", "capture runs to one side of your systems, never inside them"],
  ["It can't be quietly edited", "every record is sealed, and any change to it shows"],
  ["It will still stand in ten years", "sealed against tomorrow's computers, not just today's"],
  ["Your data never leaves", "everything sensitive stays inside your own environment"],
  ["Anyone can check it", "auditors verify your records without asking us for anything"],
] as const;

export default function S04Technology() {
  return (
    <Slide
      id="technology"
      no="04"
      kicker="Why us"
      title="Five promises the technology has to keep."
      sub="You will never have to think about how. But your security team will ask, so here is what it guarantees."
    >
      <Reveal>
        <Lines items={GUARANTEES} lead="tick" />
      </Reveal>

      <Reveal delay={0.14}>
        <Note>
          Built by a founder with published post-quantum cryptography and a
          co-founder who has built confidential-computing infrastructure. That
          pairing is rare, and it is why this is buildable at all.
        </Note>
      </Reveal>
    </Slide>
  );
}
