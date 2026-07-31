"use client";

import { useEffect, useRef } from "react";
import { EASE } from "@/config/motion.tokens";
import { SCROLL } from "@/config/pacing";
import { gsap } from "@/engines/animation/gsap";
import { usePinnedTimeline } from "@/engines/scene/usePinnedTimeline";
import { CinematicLine } from "@/components/typography/CinematicLine";
import { TrustNetwork } from "@/components/visual/TrustNetwork";
import { useExperienceStore } from "@/stores/experience.store";
import { BRAND, REALIZATION_LINES } from "./opening.data";

/**
 * The Realization + Logo reveal (Opening spec): three lines land in the dark, then
 * a single point of light expands into a glowing network — human stories become
 * invisible infrastructure — and only then does the CooL identity appear.
 */
export function Realization() {
  const reduced = useExperienceStore((s) => s.reducedMotion);
  const setActive = useExperienceStore((s) => s.setActiveChapter);
  /** Network expansion (0..1), read each frame by the canvas without re-rendering. */
  const netRef = useRef(0);

  useEffect(() => {
    // Under reduced motion the network shows fully formed (static path).
    if (reduced) netRef.current = 1;
  }, [reduced]);

  const ref = usePinnedTimeline<HTMLElement>({
    scrollLength: SCROLL.realization,
    enabled: !reduced,
    onActivate: () => setActive("opening"),
    build: (tl, root) => {
      const lines = gsap.utils.toArray<HTMLElement>(".real-line", root);
      const net = root.querySelector<HTMLElement>(".real-net");
      const logo = root.querySelector<HTMLElement>(".real-logo");
      const proxy = { v: 0 };

      lines.forEach((line) => gsap.set(line, { autoAlpha: 0, y: 18 }));
      if (net) gsap.set(net, { autoAlpha: 0 });
      if (logo) gsap.set(logo, { autoAlpha: 0, y: 16, scale: 0.98 });

      // Clean sequential reveal — one line at a time, fully clearing before the
      // next, so nothing overlaps.
      const STEP = 1.5;
      lines.forEach((line, i) => {
        const at = 0.4 + i * STEP;
        tl.to(line, { autoAlpha: 1, y: 0, duration: 0.7, ease: EASE.cinematic }, at);
        tl.to(line, { autoAlpha: 0, y: -14, duration: 0.55, ease: EASE.mass }, at + 0.85);
      });

      const netStart = 0.4 + lines.length * STEP;
      if (net) tl.to(net, { autoAlpha: 1, duration: 0.8 }, netStart - 0.2);
      tl.to(
        proxy,
        {
          v: 1,
          duration: 3,
          ease: EASE.hold,
          onUpdate: () => {
            netRef.current = proxy.v;
          },
        },
        netStart,
      );

      if (logo) {
        tl.to(
          logo,
          { autoAlpha: 1, y: 0, scale: 1, duration: 1.2, ease: EASE.cinematic },
          netStart + 2.4,
        );
      }
      tl.to({}, { duration: 1 });
    },
    buildStatic: (root) => {
      gsap.set(root.querySelectorAll(".real-line"), { autoAlpha: 0 });
      gsap.set(root.querySelectorAll(".real-net"), { autoAlpha: 1 });
      gsap.set(root.querySelectorAll(".real-logo"), { autoAlpha: 1, y: 0, scale: 1 });
    },
  });

  return (
    <section ref={ref} aria-label="The realization" className="frame-cinema overflow-hidden bg-void">
      <div className="real-net absolute inset-0">
        <TrustNetwork progressRef={netRef} />
      </div>

      {REALIZATION_LINES.map((line) => (
        <CinematicLine
          key={line}
          size="display"
          className="real-line absolute left-1/2 top-1/2 w-[min(90vw,48rem)] -translate-x-1/2 -translate-y-1/2 px-6 text-center text-paper"
        >
          {line}
        </CinematicLine>
      ))}

      <div className="real-logo absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-6 text-center">
        <CinematicLine as="p" size="cinema" voice="narrator" className="text-paper tracking-[-0.04em]">
          {BRAND.name}
        </CinematicLine>
        <CinematicLine as="p" voice="witness" size="caption" className="mt-5 text-verify">
          {BRAND.subtitle}
        </CinematicLine>
      </div>
    </section>
  );
}
