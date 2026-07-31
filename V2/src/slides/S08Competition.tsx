"use client";

import { Slide } from "@/components/Slide";
import { Aside, Beat, Body, Lead, Page, Steps } from "@/components/Book";

/**
 * Slide 8 — the comparison, reduced to the one row that decides anything.
 *
 * A five-column capability matrix is unreadable on a phone and unnecessary on a
 * laptop, because four of its five rows say the same thing differently. These
 * are the four categories a buyer will actually name, each with the single
 * thing it cannot do.
 */

const RIVALS = [
  ["AI observability", "watches how the AI performs — proves nothing about it"],
  ["Governance and GRC", "holds your policies — never sees your changes"],
  ["Compliance automation", "covers the company — not the AI inside it"],
  ["Build it yourself", "a team, a year, and it still isn't tamper-proof"],
] as const;

export default function S08Competition() {
  return (
    <Slide
      id="competition"
      no="08"
      kicker="Competition"
      title="Everyone watches AI. Nobody proves it."
      wide
    >
      <Page>
        <Lead>
          Four categories claim a piece of this. Not one of them produces
          evidence that holds up across providers and cannot be edited later.
        </Lead>

        <Steps items={RIVALS} lead="count" tone="fail" />

        <Body>
          The incumbents are each tied to their own stack, so none of them can be
          the neutral referee — and tamper-proof evidence is a cryptography
          problem, not a dashboard feature.{" "}
          <Beat tone="live">
            CooL captures every change, seals it, and proves it — across every
            provider.
          </Beat>
        </Body>

        <Aside>
          And it compounds. Every change adds to a record of the company&apos;s
          entire AI history — the exact thing a regulator asks for, and the exact
          thing that would be lost by leaving.
        </Aside>
      </Page>
    </Slide>
  );
}
