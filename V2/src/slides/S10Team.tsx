"use client";

import { Slide } from "@/components/Slide";
import { Reveal, Note } from "@/components/ui";
import InteractivePortrait from "@/components/InteractivePortrait";

/**
 * Slide 11 — the team, as the intersection rather than two CVs.
 *
 * The portraits use the lens mask: a desaturated base with full colour revealed
 * under the pointer, and on touch under a tap. One line of credential each —
 * the argument is the pairing, not the rÃ©sumÃ©.
 */

const FOUNDERS = [
  {
    name: "Pranauv Shrinaath S",
    role: "Founder & CEO",
    line: "Published post-quantum cryptography, in production networking code.",
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
      sub="Applied post-quantum cryptography and trusted execution, in the same room. This product needs both."
    >
      <Reveal>
        <div className="mx-auto grid w-full max-w-2xl gap-6 sm:grid-cols-2">
          {FOUNDERS.map((f) => (
            <div key={f.name} className="flex flex-col items-center">
              <InteractivePortrait
                src={f.src}
                alt={f.name}
                initials={f.initials}
                className="aspect-[4/5] w-full max-w-[220px] rounded-2xl border border-line"
              />
              <p className="mt-3.5 text-[15px] leading-snug font-semibold text-ink">
                {f.name}
              </p>
              <p className="mt-0.5 font-mono text-[10.5px] tracking-[0.14em] text-verify uppercase">
                {f.role}
              </p>
              <p className="mx-auto mt-2 max-w-[30ch] text-[13px] leading-relaxed text-mist">
                {f.line}
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.16}>
        <Note>Northwind Cipher Pvt. Ltd.</Note>
      </Reveal>
    </Slide>
  );
}
