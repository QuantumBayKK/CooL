"use client";

import { Slide } from "@/components/Slide";
import { Aside, Beat, Body, Figures, Lead, Names, Page, Steps } from "@/components/Book";

/**
 * Slide 2 — the problem, told as one Monday morning.
 *
 * Set as a page rather than a set of cards. The six chores are the spine of the
 * argument, so they get a hairline and indentation instead of a bordered
 * container, and the cost lands as three bare figures with nothing competing
 * for the eye.
 */

const CHORES = [
  ["Write it up", "a document explaining what changed, and why"],
  ["Get it approved", "chase security and compliance for sign-off"],
  ["Update the register", "log it in the governance system"],
  ["Tell the right people", "notify whoever owns the risk"],
  ["File the evidence", "store proof, in case an auditor ever asks"],
  ["Keep it for years", "retention rules say seven, sometimes ten"],
] as const;

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

const COSTS = [
  ["3–4 weeks", "of staff time burned every year, per team, on paperwork"],
  ["₹40–60L", "a year in compliance effort a mid-size AI team absorbs"],
  ["Deals stalled", "in security review, waiting on evidence nobody has written"],
] as const;

export default function S02Problem() {
  return (
    <Slide
      id="problem"
      no="02"
      kicker="The problem"
      title="Every AI change drags weeks of manual work behind it — and it happens all day, every day."
      wide
    >
      <Page>
        <Lead>
          It is Monday, 09:14. Someone changes one line of a prompt. That part is
          over in thirty seconds. What follows is the rest of somebody&apos;s
          afternoon.
        </Lead>

        <Body>
          Because the moment that change ships, six separate jobs appear — and
          every one of them is done by a person, by hand.
        </Body>

        <Steps items={CHORES} lead="count" tone="fail" />

        <Body>
          None of it is hard. All of it is slow. And it is spread across ten
          systems that do not talk to each other, so the same facts get typed in
          again and again.
        </Body>

        <Names items={TOOLS} />

        <Body>
          Then Tuesday arrives, and it happens once more. A team shipping a few
          changes a week is losing{" "}
          <Beat tone="fail">the better part of a month a year</Beat> to work
          nobody wanted to do and nobody can point at afterwards.
        </Body>

        <Figures items={COSTS} tone="fail" />

        <Aside>
          Figures are our estimate for a mid-size AI team, not a measured
          benchmark. The direction is what matters: the faster a company adopts
          AI, the worse this gets — and the EU AI Act and India&apos;s DPDP rules
          now demand provable records the manual way cannot produce at all.
        </Aside>
      </Page>
    </Slide>
  );
}
