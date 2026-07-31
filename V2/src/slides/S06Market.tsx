"use client";

import { Slide } from "@/components/Slide";
import { Reveal, Note } from "@/components/ui";
import MarketCircles from "@/components/MarketCircles";

/**
 * Slide 7 â€” the market, and the law that creates it.
 *
 * The HUD carries the sizing and its own sourcing, so the slide only has to add
 * the reason the market exists at all. Two laws, one line each.
 */

export default function S06Market() {
  return (
    <Slide
      id="market"
      no="06"
      kicker="Market"
      title="Regulation just made this compulsory."
      sub="The EU AI Act requires automatic logging of what AI did. India's DPDP rules carry penalties up to â‚¹250 crore. Neither can be satisfied by hand."
      wide
    >
      <Reveal>
        <MarketCircles />
      </Reveal>

      <Reveal delay={0.16}>
        <Note>
          Every one of these laws demands the same thing: provable, automated
          records. That is exactly, and only, what CooL produces.
        </Note>
      </Reveal>
    </Slide>
  );
}
