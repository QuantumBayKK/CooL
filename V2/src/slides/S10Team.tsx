"use client";

import { Slide } from "@/components/Slide";
import { Reveal, GithubMark } from "@/components/ui";

/**
 * Slide 11 — the team, framed as the intersection rather than two CVs.
 *
 * The headline is the argument: this product needs applied post-quantum
 * cryptography AND trusted-execution experience in the same room, which is a
 * genuinely rare pairing.
 */

const FOUNDERS: {
  name: string;
  role: string;
  field: string;
  points: string[];
  meta: string;
  gh: string;
}[] = [
  {
    name: "Pranauv Shrinaath S",
    role: "Founder & CEO",
    field: "Post-quantum cryptography & blockchain",
    points: [
      "ipsec-pqc-ikev2 — maps ML-KEM into IKEv2",
      "Research: decentralising public banks, secured with PQC + Hyperledger Fabric",
      "Onsite research internship, NUS Singapore",
    ],
    meta: "5 years building (since 14)",
    gh: "KenidoesCode",
  },
  {
    name: "Kailosh Kalimuthu",
    role: "Co-Founder & CTO",
    field: "Trusted execution environments & AI inference",
    points: [
      "Built BIFROST — decentralised P2P comms / storage / compute network",
      "Repurposes idle hardware into an encrypted, distributed micro-cloud",
      "6 months with US startup Decipher",
    ],
    meta: "3 years building (since 16)",
    gh: "Sk1zmo",
  },
];

export default function S10Team() {
  return (
    <Slide
      id="team"
      no="10"
      kicker="Team"
      title="The rare intersection: applied post-quantum cryptography and TEE inference."
      sub="This product cannot be built by one of those disciplines alone. Both are in the room."
      wide
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {FOUNDERS.map((f, i) => (
          <Reveal key={f.name} delay={i * 0.1}>
            <div className="frost flex h-full flex-col rounded-2xl border border-line px-4 py-4">
              <p className="text-[16px] leading-snug font-semibold text-ink">
                {f.name}
              </p>
              <p className="mt-0.5 font-mono text-[11.5px] tracking-[0.1em] text-verify uppercase">
                {f.role}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-mist italic">
                {f.field}
              </p>

              <ul className="mt-3 flex-1 space-y-1.5">
                {f.points.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2 text-[13px] leading-snug text-fog"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-verify" />
                    <span className="min-w-0">{p}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-2.5">
                <span className="font-mono text-[11.5px] text-mist">{f.meta}</span>
                <a
                  href={`https://github.com/${f.gh}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-verify hover:underline"
                >
                  <GithubMark className="size-3.5" />
                  {f.gh}
                </a>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.24}>
        <p className="mt-4 rounded-xl border border-verify/30 bg-verify/[0.07] px-4 py-3.5 text-[14.5px] leading-relaxed text-fog">
          Northwind Cipher Pvt. Ltd. — building the layer every AI change flows
          through.
        </p>
      </Reveal>
    </Slide>
  );
}
