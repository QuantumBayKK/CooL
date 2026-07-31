"use client";

import { Slide } from "@/components/Slide";
import { Reveal } from "@/components/ui";

/**
 * Slide 4 — the only slide that talks tech, and it earns it.
 *
 * Each layer leads with what it BUYS the customer, then names the mechanism.
 * An investor skimming reads the left column and understands the moat; a
 * technical diligence reader gets the exact primitive on the right.
 */

const LAYERS: { tag: string; title: string; detail: string }[] = [
  {
    tag: "CAPTURE",
    title: "Never in the critical path",
    detail:
      "Async, fail-open SDK plus CI/CD and gateway hooks. Adds zero latency, and if CooL is down your AI keeps serving.",
  },
  {
    tag: "EVIDENCE",
    title: "Tamper-evident by construction",
    detail:
      "A Rust engine hashes and signs every change into an append-only transparency log — the proven Certificate Transparency / Sigstore mechanism.",
  },
  {
    tag: "CRYPTO",
    title: "Still valid in ten years",
    detail:
      "Hybrid post-quantum signing (ML-DSA-65 + Ed25519) and key exchange (ML-KEM + X25519), so evidence survives the full retention horizon.",
  },
  {
    tag: "ATTEST",
    title: "Proves which model actually ran",
    detail:
      "The high-assurance tier binds a hardware attestation quote (NVIDIA Confidential Computing / Intel TDX) to the record.",
  },
  {
    tag: "ISOLATION",
    title: "Your data never leaves",
    detail:
      "Control plane and data plane are split: prompts, evidence and PII stay inside the customer's own environment.",
  },
];

const ADVANTAGE: [string, string][] = [
  ["Published applied PQC", "a founder with post-quantum cryptography in production networking code"],
  ["Confidential compute", "a co-founder who has built TEE infrastructure end to end"],
  ["Millions of developers", "a direct channel to the exact people who adopt an open standard"],
];

export default function S04Technology() {
  return (
    <Slide
      id="technology"
      no="04"
      kicker="Technology & moat"
      title="Built as a verifiable system of record — enterprise-grade from day one."
      sub="Five design decisions, each one a thing a competitor would have to rebuild from the foundations to match."
      wide
    >
      <div className="frost overflow-hidden rounded-2xl border border-line">
        {LAYERS.map((l, i) => (
          <Reveal key={l.tag} delay={i * 0.05}>
            <div
              className={`flex items-start gap-4 px-4 py-3.5 sm:px-5 ${
                i > 0 ? "border-t border-line" : "bg-verify/[0.06]"
              }`}
            >
              <span className="w-[68px] shrink-0 pt-0.5 font-mono text-[10.5px] font-semibold tracking-[0.14em] text-verify sm:w-[84px]">
                {l.tag}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] leading-snug font-semibold text-ink">
                  {l.title}
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-fog">
                  {l.detail}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.24}>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="frost rounded-2xl border border-line px-4 py-4">
            <p className="font-mono text-[11px] tracking-[0.16em] text-verify uppercase">
              Proprietary IP
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-fog">
              The AI-change semantics and the evidence-binding engine. Everything
              else — the log, the policy engine, the workflow engine — is
              battle-tested open source we assemble rather than reinvent.
            </p>
            <p className="mt-2.5 font-mono text-[11.5px] text-mist">
              No patents filed yet · TRL 4 — validated in the lab, and the hard
              cryptography already runs.
            </p>
          </div>

          <div className="frost rounded-2xl border border-verify/30 px-4 py-4">
            <p className="font-mono text-[11px] tracking-[0.16em] text-verify uppercase">
              Unfair advantage
            </p>
            <div className="mt-2 space-y-2">
              {ADVANTAGE.map(([big, small]) => (
                <p key={big} className="text-[13.5px] leading-snug text-fog">
                  <span className="font-semibold text-ink">{big}</span> — {small}
                </p>
              ))}
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-mist">
              Money can&apos;t shortcut that combination.
            </p>
          </div>
        </div>
      </Reveal>
    </Slide>
  );
}
