"use client";

import { Slide } from "@/components/Slide";
import { Reveal, Lines, Note } from "@/components/ui";

/**
 * Slide 5 — proof, with no exit.
 *
 * There used to be a "run it yourself" button here, which opened a second path
 * halfway through the pitch: a reader who took it left the deck at slide five
 * and never saw the market, the model or the ask. The invitation now waits
 * until the deck has finished saying what it came to say.
 */

const WORKING = [
  ["Live and public", "the code is on GitHub, installable today"],
  ["Independently checkable", "auditors verify records without trusting us"],
  ["Already proven", "the hard cryptography runs; this round finishes the rest"],
] as const;

export default function S05Proof() {
  return (
    <Slide
      id="proof"
      no="05"
      kicker="Proof"
      title="The hard part already works."
      sub="Not a mockup and not a video. It is open source, and you will be able to run it yourself in a moment."
    >
      <Reveal>
        <Lines items={WORKING} lead="tick" />
      </Reveal>

      <Reveal delay={0.14}>
        <Note tone="mist">
          One part is deliberately unfinished — the hardware-attestation tier —
          and the system reports it as incomplete rather than hiding it. We would
          rather show you the gap than have you find it.
        </Note>
      </Reveal>
    </Slide>
  );
}
