"use client";

import { EASE } from "@/config/motion.tokens";
import { SCROLL } from "@/config/pacing";
import { gsap } from "@/engines/animation/gsap";
import { usePinnedTimeline } from "@/engines/scene/usePinnedTimeline";
import { CinematicLine } from "@/components/typography/CinematicLine";
import { useExperienceStore } from "@/stores/experience.store";

/**
 * Chapter 1 — The Question (Story Bible Ch.2). Austerity as a weapon: the warmth of
 * the opening drains, imagery falls away, and one unavoidable question owns the
 * dark. The pivot from world to problem.
 */
export function TheQuestion() {
  const reduced = useExperienceStore((s) => s.reducedMotion);
  const setActive = useExperienceStore((s) => s.setActiveChapter);

  const ref = usePinnedTimeline<HTMLElement>({
    scrollLength: SCROLL.question,
    enabled: !reduced,
    onActivate: () => setActive("the-question"),
    build: (tl, root) => {
      const lead = root.querySelector(".q-lead");
      const main = root.querySelector(".q-main");
      const tail = root.querySelector(".q-tail");
      gsap.set([lead, main, tail], { autoAlpha: 0, y: 24 });

      tl.to(lead, { autoAlpha: 1, y: 0, duration: 0.6, ease: EASE.cinematic }, 0.3);
      tl.to(lead, { autoAlpha: 0, y: -16, duration: 0.5, ease: EASE.mass }, 1.3);
      tl.to(main, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE.cinematic }, 1.5);
      tl.to(tail, { autoAlpha: 1, y: 0, duration: 0.6, ease: EASE.cinematic }, 2.6);
      tl.to({}, { duration: 1.2 });
    },
    buildStatic: (root) => {
      gsap.set(root.querySelectorAll(".q-lead, .q-main, .q-tail"), { autoAlpha: 1, y: 0 });
    },
  });

  return (
    <section ref={ref} aria-label="The question" className="frame-cinema overflow-hidden bg-void">
      {/* cold light creeping in at the edges */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 50%, transparent 30%, color-mix(in oklab, var(--color-doubt) 30%, transparent) 100%)",
        }}
      />

      <div className="relative w-[min(92vw,60rem)] px-6 text-center">
        <CinematicLine size="caption" voice="witness" className="q-lead text-mist">
          Five industries. Five lives. One question.
        </CinematicLine>
        <CinematicLine size="cinema" className="q-main mt-8 text-paper">
          How do we know the machine was right?
        </CinematicLine>
        <CinematicLine size="headline" className="q-tail mt-8 text-mist">
          Or fair. Or even what it claimed to be.
        </CinematicLine>
      </div>
    </section>
  );
}
