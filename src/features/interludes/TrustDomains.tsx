"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CinematicLine } from "@/components/typography/CinematicLine";
import { HashReveal } from "@/components/visual/HashReveal";
import { useExperienceStore } from "@/stores/experience.store";
import { cn } from "@/lib/cn";

interface Domain {
  n: string;
  name: string;
  binds: string;
  defeats: string;
  tech: string;
}

/** The four independent trust domains (Architecture Blueprint §3). */
const DOMAINS: readonly Domain[] = [
  {
    n: "01",
    name: "Hardware attestation",
    binds: "Binds the computation to real silicon — and to this exact record.",
    defeats: "Defeats: fabricated “this model ran” claims.",
    tech: "Intel TDX · AMD SEV-SNP · NVIDIA CC → RATS / EAT",
  },
  {
    n: "02",
    name: "Post-quantum signature",
    binds: "Proves not one field was altered — and survives quantum computers.",
    defeats: "Defeats: altering any field, now or in decades.",
    tech: "ML-DSA-65 (FIPS 204) + Ed25519, hybrid",
  },
  {
    n: "03",
    name: "Independent witnesses",
    binds: "An append-only ledger, co-signed by parties outside our control.",
    defeats: "Defeats: rewriting or forking history.",
    tech: "RFC 6962 transparency log · t-of-n witnesses · RFC 3161",
  },
  {
    n: "04",
    name: "Public anchor",
    binds: "The record’s fingerprint, set in public bedrock.",
    defeats: "Defeats: backdating the timeline.",
    tech: "Base L2 → settles to Ethereum",
  },
];

const reveal = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
};

/**
 * "The Anatomy of Proof" — depth-on-demand made interactive. Four independent trust
 * domains bind the same fact; to forge a record you must defeat all four at once.
 * This is the moat, shown rather than claimed. Non-pinned section (framer-motion).
 */
export function TrustDomains() {
  const setActive = useExperienceStore((s) => s.setActiveChapter);
  const [active, setActive_] = useState<number | null>(null);

  return (
    <motion.section
      id="architecture"
      aria-label="The anatomy of proof"
      onViewportEnter={() => setActive("the-turn")}
      viewport={{ amount: 0.3 }}
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-void px-6 py-[var(--spacing-section)]"
    >
      <div className="relative mx-auto w-[min(96vw,76rem)]">
        <motion.div {...reveal} className="text-center">
          <CinematicLine size="caption" voice="witness" className="text-verify">
            The anatomy of proof
          </CinematicLine>
          <CinematicLine size="display" className="mt-5 text-paper">
            Four proofs of the same fact.
          </CinematicLine>
          <CinematicLine size="body-lg" voice="witness" className="mx-auto mt-6 max-w-2xl text-mist">
            Each binds one truth — <em>which model ran, on which input, producing which output,
            and when</em>. To forge a record you must defeat all four, at once.
          </CinematicLine>
          <p className="mt-6 flex items-center justify-center gap-3 text-caption uppercase tracking-[0.2em] text-mist">
            <span>binding_hash</span>
            <HashReveal value="9f2c4e7a3b81d05c…a17b4d2e" className="text-[0.95em] text-verify" />
          </p>
        </motion.div>

        <motion.div
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.1 }}
          className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {DOMAINS.map((d, i) => {
            const isActive = active === i;
            const dimmed = active !== null && !isActive;
            return (
              <button
                key={d.n}
                type="button"
                onMouseEnter={() => setActive_(i)}
                onMouseLeave={() => setActive_(null)}
                onFocus={() => setActive_(i)}
                onBlur={() => setActive_(null)}
                className={cn(
                  "group flex h-full flex-col items-start gap-4 rounded-xl border p-6 text-left transition-all duration-500 focus-visible:outline-none",
                  isActive
                    ? "-translate-y-1 border-verify/50 bg-void-raised/80 shadow-[0_0_70px_-24px_rgba(103,211,230,0.5)]"
                    : "border-white/10 bg-void-raised/40",
                  dimmed && "opacity-50",
                )}
              >
                <span className="font-instrument text-caption tracking-[0.2em] text-verify">{d.n}</span>
                <span className="text-headline font-narrator font-light leading-tight text-paper">
                  {d.name}
                </span>
                <span className="text-body text-mist">{d.binds}</span>
                <span
                  className={cn(
                    "text-caption uppercase tracking-[0.16em] text-verify transition-all duration-500",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                >
                  {d.defeats}
                </span>
                <span className="mt-auto pt-2 font-instrument text-[0.72rem] leading-relaxed text-mist/80">
                  {d.tech}
                </span>
              </button>
            );
          })}
        </motion.div>

        <motion.p
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.2 }}
          className="mt-12 text-center font-narrator text-headline font-light text-mist"
        >
          No operator can do all four.{" "}
          <span className="text-paper">Not even us.</span>
        </motion.p>
      </div>
    </motion.section>
  );
}
