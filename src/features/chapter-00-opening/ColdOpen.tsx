"use client";

import { EASE } from "@/config/motion.tokens";
import { SCROLL } from "@/config/pacing";
import { gsap } from "@/engines/animation/gsap";
import { usePinnedTimeline } from "@/engines/scene/usePinnedTimeline";
import { CinematicLine } from "@/components/typography/CinematicLine";
import { useExperienceStore } from "@/stores/experience.store";
import { COLD_OPEN_LINES } from "./opening.data";

/**
 * The Cold Open (Opening spec): complete darkness, then three lines fade in like
 * the first words of a film. No logo, nav, or chrome. Scroll reveals each line.
 */
export function ColdOpen() {
  const reduced = useExperienceStore((s) => s.reducedMotion);
  const setActive = useExperienceStore((s) => s.setActiveChapter);

  const ref = usePinnedTimeline<HTMLElement>({
    scrollLength: SCROLL.coldOpen,
    enabled: !reduced,
    onActivate: () => setActive("opening"),
    build: (tl, root) => {
      const lines = gsap.utils.toArray<HTMLElement>(".cold-line", root);
      const hint = root.querySelector<HTMLElement>(".cold-hint");
      gsap.set(lines, { autoAlpha: 0, y: 24 });

      if (hint) tl.to(hint, { autoAlpha: 0, duration: 0.4 }, 0.2);

      lines.forEach((line, i) => {
        const at = 0.5 + i * 1.1;
        tl.to(line, { autoAlpha: 1, y: 0, duration: 0.7, ease: EASE.cinematic }, at);
        if (i < lines.length - 1) {
          tl.to(line, { autoAlpha: 0, y: -16, duration: 0.6, ease: EASE.mass }, at + 0.9);
        }
      });
      tl.to({}, { duration: 1 });
    },
    buildStatic: (root) => {
      gsap.set(root.querySelectorAll(".cold-line"), { autoAlpha: 1, y: 0 });
      gsap.set(root.querySelectorAll(".cold-hint"), { autoAlpha: 0 });
    },
  });

  return (
    <section ref={ref} aria-label="Opening" className="frame-cinema bg-void">
      {COLD_OPEN_LINES.map((line) => (
        <CinematicLine
          key={line}
          size="display"
          className="cold-line absolute left-1/2 top-1/2 w-[min(90vw,52rem)] -translate-x-1/2 -translate-y-1/2 px-6 text-center text-paper"
        >
          {line}
        </CinematicLine>
      ))}

      <span className="cold-hint pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 text-caption uppercase tracking-[0.35em] text-mist">
        scroll
      </span>
    </section>
  );
}
