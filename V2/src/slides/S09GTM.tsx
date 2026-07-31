"use client";

import { Slide } from "@/components/Slide";
import { Reveal, Lines, Note, Stats } from "@/components/ui";

/**
 * Slide 10 â€” where we start, and why there.
 * The beachhead argument is one sentence; the rest is the motion in four steps.
 */

const MOTION = [
  ["Free SDK", "a developer installs it in an hour"],
  ["Paid pilot", "one regulated workflow, set up with us"],
  ["Subscription", "the team stops doing the paperwork"],
  ["Company licence", "every change in the business runs through it"],
] as const;

const TIMING = [
  ["1â€“2 quarters", "to first paid pilots"],
  ["2â€“3 quarters", "to recurring revenue"],
] as const;

export default function S09GTM() {
  return (
    <Slide
      id="gtm"
      no="09"
      kicker="Go to market"
      title="Start where the pain is already costing money."
      sub="AI companies in finance, health and legal â€” the ones losing deals this quarter while security review waits for evidence."
    >
      <Reveal>
        <Lines items={MOTION} lead="count" />
      </Reveal>

      <Reveal delay={0.14}>
        <div className="mt-8">
          <Stats items={TIMING} tone="live" />
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <Note>
          Founder-led, seeded through a developer audience already in the
          millions.
        </Note>
      </Reveal>
    </Slide>
  );
}
