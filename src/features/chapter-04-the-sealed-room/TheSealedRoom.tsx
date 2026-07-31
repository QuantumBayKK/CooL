"use client";

import { EASE } from "@/config/motion.tokens";
import { SCROLL } from "@/config/pacing";
import { gsap } from "@/engines/animation/gsap";
import { usePinnedTimeline } from "@/engines/scene/usePinnedTimeline";
import { CinematicLine } from "@/components/typography/CinematicLine";
import { SealMark } from "@/components/visual/SealMark";
import { useExperienceStore } from "@/stores/experience.store";

/**
 * Chapter 4 — The Sealed Room (Story Bible Ch.5). TEE as metaphor before mechanism:
 * a chamber whose walls prove they were never opened. Depth-on-demand reveals the
 * real term for those who lean in.
 */
export function TheSealedRoom() {
  const reduced = useExperienceStore((s) => s.reducedMotion);
  const setActive = useExperienceStore((s) => s.setActiveChapter);

  const ref = usePinnedTimeline<HTMLElement>({
    scrollLength: SCROLL.sealedRoom,
    enabled: !reduced,
    onActivate: () => setActive("the-sealed-room"),
    build: (tl, root) => {
      const items = root.querySelectorAll(".sr-reveal");
      gsap.set(items, { autoAlpha: 0, y: 24 });
      tl.to(items, { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE.cinematic, stagger: 0.3 }, 0.3);
      tl.to({}, { duration: 2 });
    },
    buildStatic: (root) => {
      gsap.set(root.querySelectorAll(".sr-reveal"), { autoAlpha: 1, y: 0 });
    },
  });

  return (
    <section
      ref={ref}
      id="security"
      aria-label="The sealed room"
      className="frame-cinema overflow-hidden bg-void"
    >
      {/* The chamber — a sealed vault whose walls prove they were never opened.
          Rendered in pure 2D/CSS (no 3D model) for a calm, premium read. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative grid h-[min(70vw,32rem)] w-[min(70vw,32rem)] place-items-center">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--color-verify) 12%, transparent), transparent 62%)",
            }}
          />
          {/* Concentric chamber walls. */}
          <div className="absolute inset-[12%] rounded-[2rem] border border-verify/15" />
          <div className="absolute inset-[22%] rounded-[1.6rem] border border-verify/25" />
          <div
            className="absolute inset-[32%] rounded-[1.2rem] border border-verify/40"
            style={{ boxShadow: "0 0 40px color-mix(in oklab, var(--color-verify) 18%, transparent)" }}
          />
          <SealMark size={148} className="relative opacity-90" />
        </div>
      </div>

      <div className="pointer-events-none relative ml-auto w-full max-w-xl px-8 text-center md:mr-[6vw] md:text-right">
        <CinematicLine size="caption" voice="witness" className="sr-reveal text-mist">
          Where does a decision happen, so no one can reach inside?
        </CinematicLine>
        <CinematicLine size="display" className="sr-reveal mt-5 text-paper">
          A sealed room.
        </CinematicLine>
        <CinematicLine size="body-lg" voice="witness" className="sr-reveal mt-6 text-mist">
          The work happens inside a chamber whose walls prove they were never opened.
          You can check the seal from outside — without ever being let in.
        </CinematicLine>
        <p className="sr-reveal mt-8 font-instrument text-caption uppercase tracking-[0.2em] text-verify">
          Trusted Execution Environment · remote attestation
        </p>
      </div>
    </section>
  );
}
