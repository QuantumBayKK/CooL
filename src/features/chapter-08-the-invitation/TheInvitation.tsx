"use client";

import { motion } from "framer-motion";
import { CinematicLine } from "@/components/typography/CinematicLine";
import { useExperienceStore } from "@/stores/experience.store";
import { BRAND } from "@/features/chapter-00-opening/opening.data";

/** Differentiated, low-pressure paths (Story Bible Ch.9). Wire real targets later. */
const PATHS = [
  { label: "Read the architecture", sub: "For engineers & security teams", href: "#architecture" },
  { label: "Talk to the team", sub: "For enterprises & regulators", href: "#contact" },
  { label: "For partners & investors", sub: "Build the trust layer with us", href: "#partners" },
] as const;

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.4 },
  transition: { duration: 1, ease: [0.16, 1, 0.3, 1] as const },
};

/**
 * Chapter 8 — The Invitation (Story Bible Ch.9). The film ends; the document begins.
 * Calm, confident, generous. Conviction with somewhere to go. The "real website"
 * affordances surface here for the first time.
 */
export function TheInvitation() {
  const setActive = useExperienceStore((s) => s.setActiveChapter);

  return (
    <motion.section
      aria-label="The invitation"
      onViewportEnter={() => setActive("the-invitation")}
      viewport={{ amount: 0.3 }}
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-void px-6 py-[var(--spacing-section)]"
    >
      <div className="relative mx-auto flex w-[min(94vw,64rem)] flex-col items-center text-center">
        <motion.div {...reveal}>
          <CinematicLine size="caption" voice="witness" className="text-verify">
            {BRAND.subtitle}
          </CinematicLine>
        </motion.div>

        <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
          <CinematicLine size="cinema" className="mt-6 text-paper">
            Proof for the age of AI.
          </CinematicLine>
        </motion.div>

        <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.2 }}>
          <CinematicLine size="body-lg" voice="witness" className="mt-8 max-w-2xl text-mist">
            {BRAND.tagline} {BRAND.name} creates an unforgeable record of which model ran, on
            which input, producing which output, and when — hardware-attested, post-quantum,
            and verifiable by anyone offline. Provable by anyone, changeable by no one. Even us.
          </CinematicLine>
        </motion.div>

        <motion.div
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.3 }}
          className="mt-14 grid w-full grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {PATHS.map((path) => (
            <a
              key={path.href}
              href={path.href}
              className="group flex flex-col items-start gap-2 rounded-xl border border-white/10 bg-void-raised/60 p-6 text-left transition-colors hover:border-verify/40 focus-visible:border-verify/40 focus-visible:outline-none"
            >
              <span className="text-body text-paper transition-colors group-hover:text-verify">
                {path.label}
              </span>
              <span className="text-caption uppercase tracking-[0.18em] text-mist">{path.sub}</span>
            </a>
          ))}
        </motion.div>

        <motion.p
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.4 }}
          className="mt-16 font-narrator text-headline font-light text-mist"
        >
          Don&rsquo;t trust us. <span className="text-verify">Verify it yourself.</span>
        </motion.p>
      </div>

      <footer className="mt-24 flex w-[min(94vw,64rem)] flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-mist sm:flex-row">
        <span className="text-caption uppercase tracking-[0.25em]">{BRAND.name}</span>
        <nav aria-label="Footer" className="flex gap-8 text-caption uppercase tracking-[0.2em]">
          <a href="#architecture" className="transition-colors hover:text-paper">Architecture</a>
          <a href="#security" className="transition-colors hover:text-paper">Security</a>
          <a href="#contact" className="transition-colors hover:text-paper">Contact</a>
        </nav>
        <span className="text-caption tracking-[0.1em]">© 2026 {BRAND.entity}</span>
      </footer>
    </motion.section>
  );
}
