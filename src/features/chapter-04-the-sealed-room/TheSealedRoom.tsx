"use client";

import dynamic from "next/dynamic";
import { EASE } from "@/config/motion.tokens";
import { SCROLL } from "@/config/pacing";
import { gsap } from "@/engines/animation/gsap";
import { usePinnedTimeline } from "@/engines/scene/usePinnedTimeline";
import { CinematicLine } from "@/components/typography/CinematicLine";
import { SealMark } from "@/components/visual/SealMark";
import { useExperienceStore } from "@/stores/experience.store";

// R3F is heavy and client-only — load it on demand, never on the server.
const SealedRoomScene = dynamic(() => import("@/three/SealedRoomScene"), {
  ssr: false,
  loading: () => null,
});

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
    <section ref={ref} aria-label="The sealed room" className="frame-cinema overflow-hidden bg-void">
      {/* The chamber */}
      <div className="absolute inset-0 flex items-center justify-center">
        {reduced ? (
          <SealMark size={220} className="opacity-80" />
        ) : (
          <div className="h-[min(80vh,40rem)] w-[min(90vw,40rem)]">
            <SealedRoomScene />
          </div>
        )}
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
