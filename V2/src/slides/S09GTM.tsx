"use client";

import { Slide } from "@/components/Slide";
import { Aside, Body, Figures, Lead, Page, Steps } from "@/components/Book";

/**
 * Slide 9 — where we start, and why there.
 * The beachhead argument is one sentence; the motion is four steps.
 */

const MOTION = [
  ["Free SDK", "a developer installs it in an hour"],
  ["Paid pilot", "one regulated workflow, set up with us"],
  ["Subscription", "that team stops doing the paperwork"],
  ["Company licence", "every AI change in the business runs through it"],
] as const;

const TIMING = [
  ["1–2 quarters", "to first paid pilots"],
  ["2–3 quarters", "to recurring revenue"],
] as const;

export default function S09GTM() {
  return (
    <Slide
      id="gtm"
      no="09"
      kicker="Go to market"
      title="Start where the pain is already costing money."
      wide
    >
      <Page>
        <Lead>
          AI companies in finance, health and legal. Not because they are the
          biggest market, but because they are losing deals this quarter while
          security review waits on evidence nobody has written.
        </Lead>

        <Body>
          They already know they have the problem. That removes the hardest part
          of an enterprise sale — convincing someone the thing is worth solving.
        </Body>

        <Steps items={MOTION} lead="count" tone="verify" />

        <Figures items={TIMING} tone="live" />

        <Aside>
          Founder-led, seeded through a developer audience already in the
          millions — the same people who decide which tools a company ends up
          standardising on.
        </Aside>
      </Page>
    </Slide>
  );
}
