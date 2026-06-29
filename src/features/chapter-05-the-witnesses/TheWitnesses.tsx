"use client";

import { useEffect, useRef, useState } from "react";
import { EASE } from "@/config/motion.tokens";
import { SCROLL } from "@/config/pacing";
import { gsap } from "@/engines/animation/gsap";
import { usePinnedTimeline } from "@/engines/scene/usePinnedTimeline";
import { CinematicLine } from "@/components/typography/CinematicLine";
import { EvidenceRecord, type EvidenceField } from "@/components/visual/EvidenceRecord";
import { TrustNetwork } from "@/components/visual/TrustNetwork";
import { audioEngine } from "@/engines/audio/AudioEngine";
import { useExperienceStore } from "@/stores/experience.store";

const FIELDS: EvidenceField[] = [
  { label: "Subject", value: "Applicant #4471" },
  { label: "Decision", value: "DECLINED" },
  { label: "Confidence", value: "0.41" },
  { label: "Model", value: "risk-v2.3.1" },
];

/**
 * Chapter 5 — The Witnesses (Story Bible Ch.6). Independent witnessing, an append-only
 * ledger, and public anchoring — the antidote to Ch.2's villain. The payoff: the
 * silent edit is now impossible. Try it; the network rejects it, visibly.
 */
export function TheWitnesses() {
  const reduced = useExperienceStore((s) => s.reducedMotion);
  const setActive = useExperienceStore((s) => s.setActiveChapter);
  const netRef = useRef(0);
  const [rejected, setRejected] = useState(false);
  const rejectTimer = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) netRef.current = 1;
    return () => {
      if (rejectTimer.current) window.clearTimeout(rejectTimer.current);
    };
  }, [reduced]);

  const attemptTamper = () => {
    setRejected(true);
    audioEngine.cue("reject");
    if (rejectTimer.current) window.clearTimeout(rejectTimer.current);
    rejectTimer.current = window.setTimeout(() => setRejected(false), 1800);
  };

  const ref = usePinnedTimeline<HTMLElement>({
    scrollLength: SCROLL.witnesses,
    enabled: !reduced,
    onActivate: () => setActive("the-witnesses"),
    onProgress: (p) => {
      netRef.current = Math.min(1, p * 1.25);
    },
    build: (tl, root) => {
      const items = root.querySelectorAll(".w-reveal");
      gsap.set(items, { autoAlpha: 0, y: 24 });
      tl.to(items, { autoAlpha: 1, y: 0, duration: 0.7, ease: EASE.cinematic, stagger: 0.35 }, 0.4);
      tl.to({}, { duration: 3 });
    },
    buildStatic: (root) => {
      gsap.set(root.querySelectorAll(".w-reveal"), { autoAlpha: 1, y: 0 });
    },
  });

  return (
    <section ref={ref} aria-label="The witnesses" className="frame-cinema overflow-hidden bg-void">
      <div className="absolute inset-0">
        <TrustNetwork progressRef={netRef} nodeCount={84} />
      </div>

      <div className="relative grid w-[min(94vw,72rem)] grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
        <div className="text-center md:text-left">
          <CinematicLine size="caption" voice="witness" className="w-reveal text-mist">
            How can a record never be quietly changed?
          </CinematicLine>
          <CinematicLine size="display" className="w-reveal mt-5 text-paper">
            Make everyone a witness.
          </CinematicLine>
          <CinematicLine size="body-lg" voice="witness" className="w-reveal mt-6 text-mist">
            Independent witnesses see every record. A ledger that only grows — pages can be
            added, never torn out or rewritten. The fingerprint is set in public bedrock.
          </CinematicLine>
          <p className="w-reveal mt-8 font-instrument text-caption uppercase tracking-[0.2em] text-verify">
            Witness network · transparency log · blockchain anchoring
          </p>
        </div>

        <div className="w-reveal flex flex-col items-center gap-6">
          <EvidenceRecord
            fields={FIELDS}
            state={rejected ? "alarm" : "verified"}
            sealed
            footer={
              rejected
                ? "change rejected · 7 independent witnesses disagree"
                : "anchored · block #842,113 · 7 witnesses"
            }
          />
          <button
            type="button"
            onClick={attemptTamper}
            className="pointer-events-auto text-caption uppercase tracking-[0.25em] text-mist underline-offset-8 transition-colors hover:text-paper hover:underline focus-visible:text-paper focus-visible:outline-none"
          >
            {rejected ? "rejected." : "→ try to change it now"}
          </button>
        </div>
      </div>
    </section>
  );
}
