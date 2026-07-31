"use client";

import { Slide } from "@/components/Slide";
import { Aside, Beat, Body, Figures, Lead, Names, Page, Steps } from "@/components/Book";

/**
 * Slide 3 — the same Monday, with the work removed.
 *
 * Mirrors slide 2 exactly: same six jobs, same order, now past tense and
 * ticked, on the same page layout. The reader does not need to be told what
 * changed — they recognise the list and see that it has already happened.
 */

const DONE = [
  ["Written up", "the change document, generated and versioned"],
  ["Approved", "the right people asked, their answers recorded"],
  ["Registered", "the governance system updated"],
  ["Announced", "risk owners told, where they already work"],
  ["Filed", "evidence sealed so it cannot be altered later"],
  ["Retained", "kept for as long as the regulator requires"],
] as const;

const FITS = [
  "GitHub",
  "GitLab",
  "Jenkins",
  "OpenAI",
  "Anthropic",
  "Bedrock",
  "Vertex",
  "Jira",
  "Confluence",
  "Slack",
  "ServiceNow",
];

const GAINS = [
  ["Under an hour", "to connect — and nothing about how your teams work changes"],
  ["Seconds", "instead of an afternoon, on every single change"],
  ["Up to 90%", "off the cost of staying compliant"],
] as const;

export default function S03Solution() {
  return (
    <Slide
      id="solution"
      no="03"
      kicker="The solution"
      title="Install once. That Monday morning simply disappears."
      wide
    >
      <Page>
        <Lead>
          Same 09:14. Same one line of a prompt. This time nothing else happens
          to anyone.
        </Lead>

        <Body>
          CooL sees the change the moment it ships and does the six jobs itself —
          the same six, in the same order, finished{" "}
          <Beat tone="live">before the laptop closes</Beat>.
        </Body>

        <Steps items={DONE} lead="tick" tone="live" />

        <Body>
          It reads the setup you already have — your code system, your AI
          providers, your ticketing — and connects to it. There is no migration,
          no new platform, and nobody has to be retrained.
        </Body>

        <Names items={FITS} />

        <Body>
          The month a year your team was losing goes back to them. The compliance
          bill falls with it. And audits stop being fire drills, because the
          evidence was sealed the moment the change shipped — and it holds up{" "}
          <Beat tone="live">whichever AI provider you use</Beat>.
        </Body>

        <Figures items={GAINS} tone="live" />

        <Aside>
          Nobody writes a document. Nobody chases an approval. Nobody goes
          looking for proof six months later.
        </Aside>
      </Page>
    </Slide>
  );
}
