"use client";

import { Slide } from "@/components/Slide";
import { Aside, Beat, Body, Lead, Page } from "@/components/Book";
import MarketCircles from "@/components/MarketCircles";

/**
 * Slide 6 — the market, and the law that creates it.
 *
 * The HUD carries the sizing and its own sourcing, so the prose only has to
 * explain why the market exists at all.
 */

export default function S06Market() {
  return (
    <Slide
      id="market"
      no="06"
      kicker="Market"
      title="Regulation just turned this from optional into compulsory."
      wide
    >
      <Page>
        <Lead>
          The EU AI Act requires high-risk AI systems to log what they did,
          automatically, for their entire lifetime. India&apos;s DPDP rules carry
          penalties up to <Beat tone="fail">₹250 crore per breach</Beat>.
        </Lead>

        <Body>
          Neither can be satisfied by a person writing documents. Both demand the
          same thing — provable, automatic records of what the AI did — which is
          exactly, and only, what CooL produces.
        </Body>

        <div className="mt-8">
          <MarketCircles />
        </div>

        <Aside>
          Sizing from published market research, narrowed to enterprises already
          running AI in regulated or security-reviewed environments. Each ring
          shows its own working.
        </Aside>
      </Page>
    </Slide>
  );
}
