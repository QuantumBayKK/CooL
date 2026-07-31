"use client";

import { Slide } from "@/components/Slide";
import { Reveal, Lines, Note } from "@/components/ui";

/**
 * Slide 8 — how the money works, as a ladder read top to bottom.
 * Four lines, ordered by commitment, so the land-and-expand motion is visible
 * without a diagram explaining it.
 */

const TIERS = [
  ["Free", "developers install it in an hour — this is how we get in"],
  ["Per team, monthly", "the paperwork stops for that team"],
  ["Company-wide, annual", "CooL becomes the standard every change runs through"],
  ["Services", "private and on-prem deployment for regulated buyers"],
] as const;

export default function S07Model() {
  return (
    <Slide
      id="model"
      no="07"
      kicker="Business model"
      title="Free to adopt. Paid to scale."
      sub="One developer can start alone. The company pays when it wants the work to stop everywhere."
    >
      <Reveal>
        <Lines items={TIERS} />
      </Reveal>

      <Reveal delay={0.14}>
        <Note tone="live">
          We sell time saved and audits de-risked. The technology is why it holds
          up — never the reason anyone buys.
        </Note>
      </Reveal>
    </Slide>
  );
}
