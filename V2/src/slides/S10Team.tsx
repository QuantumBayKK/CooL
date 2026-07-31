"use client";

import { Slide } from "@/components/Slide";
import { Aside, Body, Lead, Line, Page } from "@/components/Book";
import InteractivePortrait from "@/components/InteractivePortrait";

/**
 * Slide 10 — the team, as the intersection rather than two CVs.
 *
 * The portraits keep the lens mask: desaturated until the pointer crosses them,
 * full colour underneath, and on touch a tap opens it. No card around them —
 * the photograph is the object.
 */

const FOUNDERS = [
  {
    name: "Pranauv Shrinaath S",
    role: "Founder & CEO",
    line: "Published post-quantum cryptography, running in production networking code.",
    src: "/founders/pranauv.jpg",
    initials: "PS",
  },
  {
    name: "Kailosh Kalimuthu",
    role: "Co-Founder & CTO",
    line: "Built confidential-computing and distributed inference infrastructure.",
    src: "/founders/kailosh.jpg",
    initials: "KK",
  },
];

export default function S10Team() {
  return (
    <Slide
      id="team"
      no="10"
      kicker="Team"
      title="A rare pairing, and the reason this is buildable."
      wide
    >
      <Page>
        <Lead>
          This product needs applied post-quantum cryptography and trusted
          execution in the same room. Very few rooms have both.
        </Lead>

        <div className="mt-8 grid max-w-3xl gap-8 sm:grid-cols-2">
          {FOUNDERS.map((f) => (
            <Line key={f.name}>
              <div className="flex items-start gap-4">
                <InteractivePortrait
                  src={f.src}
                  alt={f.name}
                  initials={f.initials}
                  className="aspect-[4/5] w-[104px] shrink-0 rounded-xl sm:w-[118px]"
                />
                <div className="min-w-0 pt-1">
                  <p className="text-[15px] leading-snug font-semibold text-ink">
                    {f.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[10.5px] tracking-[0.14em] text-verify uppercase">
                    {f.role}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-mist">
                    {f.line}
                  </p>
                </div>
              </div>
            </Line>
          ))}
        </div>

        <Body>
          Between them: research published on mapping post-quantum key exchange
          into production networking, and a decentralised compute network built
          from the ground up. Both have been building since school.
        </Body>

        <Aside>Northwind Cipher Pvt. Ltd.</Aside>
      </Page>
    </Slide>
  );
}
