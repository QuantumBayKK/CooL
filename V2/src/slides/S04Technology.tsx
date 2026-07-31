"use client";

import { Slide } from "@/components/Slide";
import { Aside, Body, Lead, Page, Steps } from "@/components/Book";

/**
 * Slide 4 — the technology, present only as credibility.
 *
 * Nobody buys this because of the cryptography; they buy it because the work
 * stops. So each promise leads with what it guarantees the customer and names
 * the mechanism second, and the whole slide exists to answer one silent
 * question — are these the people who can actually build it.
 */

const GUARANTEES = [
  ["It can never slow you down", "capture runs beside your systems, never inside them"],
  ["It cannot be quietly edited", "every record is sealed, and any change to one shows"],
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
      wide
    >
      <Page>
        <Lead>
          You will never have to think about how any of this works. Your security
          team will ask, though — so here is what it guarantees them.
        </Lead>

        <Steps items={GUARANTEES} lead="tick" tone="verify" />

        <Body>
          Underneath: an append-only record that hashes and signs every change,
          using the same mechanism that secures the certificates behind every
          website you visit. Signed twice over, so the evidence outlives the
          cryptography of its own decade.
        </Body>

        <Aside>
          Built by a founder with published post-quantum cryptography in
          production networking code, and a co-founder who has built
          confidential-computing infrastructure end to end. That pairing is rare,
          and it is the reason this is buildable at all.
        </Aside>
      </Page>
    </Slide>
  );
}
