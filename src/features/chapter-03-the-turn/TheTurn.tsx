"use client";

import { useRef, useState } from "react";
import { EASE } from "@/config/motion.tokens";
import { SCROLL } from "@/config/pacing";
import { gsap } from "@/engines/animation/gsap";
import { usePinnedTimeline } from "@/engines/scene/usePinnedTimeline";
import { CinematicLine } from "@/components/typography/CinematicLine";
import { EvidenceRecord, type EvidenceField } from "@/components/visual/EvidenceRecord";
import { SealMark } from "@/components/visual/SealMark";
import { audioEngine } from "@/engines/audio/AudioEngine";
import { useExperienceStore } from "@/stores/experience.store";

const FIELDS: EvidenceField[] = [
  { label: "Subject", value: "Applicant #4471" },
  { label: "Decision", value: "DECLINED" },
  { label: "Confidence", value: "0.41" },
  { label: "Model", value: "risk-v2.3.1" },
];

/**
 * Chapter 3 — The Turn (Story Bible Ch.4). The hinge of the film. The fragile record
 * is sealed in one luminous motion; the "verify" accent is born; and trust itself is
 * reframed: not "trust us" but "verify it yourself." Relief, hope, light.
 */
export function TheTurn() {
  const reduced = useExperienceStore((s) => s.reducedMotion);
  const setActive = useExperienceStore((s) => s.setActiveChapter);
  const [sealed, setSealed] = useState(false);
  const sealedRef = useRef(false);

  const ref = usePinnedTimeline<HTMLElement>({
    scrollLength: SCROLL.turn,
    enabled: !reduced,
    onActivate: () => setActive("the-turn"),
    onProgress: (p) => {
      const next = p > 0.45;
      if (next !== sealedRef.current) {
        sealedRef.current = next;
        setSealed(next);
        if (next) audioEngine.cue("seal");
      }
    },
    build: (tl, root) => {
      const lead = root.querySelector(".turn-lead");
      const card = root.querySelector(".turn-card");
      const ring = root.querySelector(".seal-ring");
      const check = root.querySelector(".seal-check");
      const thesis = root.querySelectorAll(".turn-thesis");
      const sub = root.querySelector(".turn-sub");

      gsap.set(lead, { autoAlpha: 0, y: 24 });
      gsap.set(card, { autoAlpha: 0, y: 30 });
      gsap.set([ring, check], { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(thesis, { autoAlpha: 0, y: 24 });
      gsap.set(sub, { autoAlpha: 0 });

      tl.to(lead, { autoAlpha: 1, y: 0, duration: 0.6, ease: EASE.cinematic }, 0.2);
      tl.to(card, { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE.cinematic }, 0.5);
      tl.to(lead, { autoAlpha: 0, duration: 0.5 }, 1.6);
      tl.to(ring, { strokeDashoffset: 0, duration: 1.0, ease: EASE.mass }, 1.8);
      tl.to(check, { strokeDashoffset: 0, duration: 0.6, ease: EASE.cinematic }, 2.6);
      tl.to(thesis, { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE.cinematic, stagger: 0.25 }, 3.0);
      tl.to(sub, { autoAlpha: 1, duration: 0.8, ease: EASE.cinematic }, 3.8);
      tl.to({}, { duration: 1 });
    },
    buildStatic: (root) => {
      gsap.set(root.querySelectorAll(".turn-lead, .turn-card, .turn-thesis"), { autoAlpha: 1, y: 0 });
      gsap.set(root.querySelectorAll(".turn-sub"), { autoAlpha: 1 });
      gsap.set(root.querySelectorAll(".seal-ring, .seal-check"), { strokeDashoffset: 0 });
    },
  });

  return (
    <section ref={ref} aria-label="The turn" className="frame-cinema overflow-hidden bg-void">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 60% at 50% 45%, color-mix(in oklab, var(--color-verify) 12%, transparent), transparent 70%)",
        }}
      />

      <div className="relative grid w-[min(94vw,72rem)] grid-cols-1 items-center gap-14 px-6 md:grid-cols-2">
        <div className="flex flex-col items-center md:items-start">
          <div className="relative">
            <EvidenceRecord
              fields={FIELDS}
              state={sealed ? "verified" : "cold"}
              sealed={sealed}
              footer="sha256: 9f2c4e…a17b   ·   sealed at source"
            />
            <span className="pointer-events-none absolute -right-6 -top-6">
              <SealMark size={88} />
            </span>
          </div>
        </div>

        <div className="text-center md:text-left">
          <CinematicLine size="caption" voice="witness" className="turn-lead text-verify">
            There is another way.
          </CinematicLine>
          <div className="mt-4">
            <CinematicLine size="cinema" className="turn-thesis block text-paper">
              Don&rsquo;t trust us.
            </CinematicLine>
            <CinematicLine size="cinema" className="turn-thesis block text-verify">
              Verify it yourself.
            </CinematicLine>
          </div>
          <CinematicLine size="body-lg" voice="witness" className="turn-sub mt-8 max-w-prose text-mist">
            Every decision is sealed the instant it&rsquo;s made — beyond anyone&rsquo;s reach.
            Even ours.
          </CinematicLine>
        </div>
      </div>
    </section>
  );
}
