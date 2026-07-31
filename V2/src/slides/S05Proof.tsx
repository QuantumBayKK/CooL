"use client";

import { Slide } from "@/components/Slide";
import { Aside, Beat, Body, Lead, Page, Steps } from "@/components/Book";

/**
 * Slide 5 — proof, with no exit.
 *
 * There is no button here on purpose. A link at this point costs the reader the
 * market, the model and the ask; the invitation to go and run it waits until
 * the deck has finished.
 */

const WORKING = [
  ["Live and public", "the code is on GitHub, installable today"],
  ["Independently checkable", "auditors verify a record without trusting us"],
  ["Already running", "the hard cryptography works; this round finishes the rest"],
] as const;

export default function S05Proof() {
  return (
    <Slide
      id="proof"
      no="05"
      kicker="Proof"
      title="The hard part already works — and it's public."
      wide
    >
      <Page>
        <Lead>
          Not a mockup, and not a video. The cryptography runs in the browser of
          whoever is reading this, and the source is on GitHub under Apache-2.0.
        </Lead>

        <Steps items={WORKING} lead="tick" tone="live" />

        <Body>
          Anyone can take a record, run the open-source checker against it, and
          get a yes or a no without us being involved at all. Change a single
          character of that record first, and{" "}
          <Beat tone="fail">the answer becomes no</Beat> — and it says which part
          broke.
        </Body>

        <Aside>
          One part is deliberately unfinished — the hardware-attestation tier —
          and the system reports it as incomplete rather than hiding it. We would
          rather show you the gap than have you find it.
        </Aside>
      </Page>
    </Slide>
  );
}
