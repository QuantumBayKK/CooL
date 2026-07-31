"use client";

import { Slide } from "@/components/Slide";
import { Aside, Beat, Body, Lead, Page, Steps } from "@/components/Book";

/**
 * Slide 7 — how the money works, read top to bottom.
 * Ordered by commitment, so the land-and-expand motion is visible without a
 * diagram explaining it.
 */

const TIERS = [
  ["Free", "a developer installs it in an hour — this is how we get in the door"],
  ["Per team, monthly", "the paperwork stops for that team"],
  ["Company-wide, annual", "every AI change in the business runs through it"],
  ["Services", "private and on-prem deployment for regulated buyers"],
] as const;

export default function S07Model() {
  return (
    <Slide
      id="model"
      no="07"
      kicker="Business model"
      title="Free to adopt. Paid to scale. Enterprise to standardise."
      wide
    >
      <Page>
        <Lead>
          One developer can start alone, on a Tuesday, without asking anyone. The
          company starts paying when it wants the work to stop everywhere.
        </Lead>

        <Steps items={TIERS} lead="count" tone="verify" />

        <Body>
          The pitch to a buyer is never cryptography. It is that the month a year
          their team loses to compliance paperwork comes back, and that the next
          audit is already prepared. We sell{" "}
          <Beat tone="live">time saved and audits de-risked</Beat>.
        </Body>

        <Aside>
          The technology is why the claim holds up under scrutiny — never the
          reason anyone buys.
        </Aside>
      </Page>
    </Slide>
  );
}
