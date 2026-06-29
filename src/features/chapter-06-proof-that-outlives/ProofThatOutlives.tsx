"use client";

import { EASE } from "@/config/motion.tokens";
import { SCROLL } from "@/config/pacing";
import { gsap } from "@/engines/animation/gsap";
import { usePinnedTimeline } from "@/engines/scene/usePinnedTimeline";
import { CinematicLine } from "@/components/typography/CinematicLine";
import { VerifyYourself } from "@/components/visual/VerifyYourself";
import { useExperienceStore } from "@/stores/experience.store";

/**
 * Chapter 6 — Proof That Outlives Everything (Story Bible Ch.7). Permanence and
 * independence: locks built for tomorrow's machines, and proof you can carry away and
 * check yourself — offline, without trusting our servers, or us. The technical case,
 * closed. "Operator-resistant" made concrete.
 */
export function ProofThatOutlives() {
  const reduced = useExperienceStore((s) => s.reducedMotion);
  const setActive = useExperienceStore((s) => s.setActiveChapter);

  const ref = usePinnedTimeline<HTMLElement>({
    scrollLength: SCROLL.proof,
    enabled: !reduced,
    onActivate: () => setActive("proof-that-outlives"),
    build: (tl, root) => {
      const items = root.querySelectorAll(".p-reveal");
      gsap.set(items, { autoAlpha: 0, y: 24 });
      tl.to(items, { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE.cinematic, stagger: 0.3 }, 0.3);
      tl.to({}, { duration: 2 });
    },
    buildStatic: (root) => {
      gsap.set(root.querySelectorAll(".p-reveal"), { autoAlpha: 1, y: 0 });
    },
  });

  return (
    <section ref={ref} aria-label="Proof that outlives everything" className="frame-cinema overflow-hidden bg-void">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 80% at 50% 60%, color-mix(in oklab, var(--color-verify) 8%, transparent), transparent 70%)",
        }}
      />

      <div className="relative grid w-[min(94vw,72rem)] grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
        <div className="text-center md:text-left">
          <CinematicLine size="caption" voice="witness" className="p-reveal text-mist">
            Will the proof still hold — and can anyone check it?
          </CinematicLine>
          <CinematicLine size="display" className="p-reveal mt-5 text-paper">
            Proof that outlives everything.
          </CinematicLine>
          <CinematicLine size="body-lg" voice="witness" className="p-reveal mt-6 text-mist">
            Locks built to resist tomorrow&rsquo;s quantum computers, and proof you can carry
            away — verified in a browser, offline, with no trust in our servers or us. CooL
            proves exactly what happened: which model ran, on which input, producing which
            output, and when. Nothing it cannot cryptographically back.
          </CinematicLine>
          <p className="p-reveal mt-8 font-instrument text-caption uppercase tracking-[0.2em] text-verify">
            ML-DSA-65 (post-quantum) · offline WASM verifier
          </p>
        </div>

        <div className="p-reveal flex justify-center md:justify-end">
          <VerifyYourself />
        </div>
      </div>
    </section>
  );
}
