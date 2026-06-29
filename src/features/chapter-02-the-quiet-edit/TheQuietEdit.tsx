"use client";

import { useRef, useState } from "react";
import { EASE } from "@/config/motion.tokens";
import { SCROLL } from "@/config/pacing";
import { gsap } from "@/engines/animation/gsap";
import { usePinnedTimeline } from "@/engines/scene/usePinnedTimeline";
import { CinematicLine } from "@/components/typography/CinematicLine";
import { EvidenceRecord, type EvidenceField } from "@/components/visual/EvidenceRecord";
import { audioEngine } from "@/engines/audio/AudioEngine";
import { useExperienceStore } from "@/stores/experience.store";
import { cn } from "@/lib/cn";

/** The same record, before and after a silent change. The hash never changes —
 *  that is the horror: no trace remains. */
function recordFields(tampered: boolean): EvidenceField[] {
  return [
    { label: "Subject", value: "Applicant #4471" },
    { label: "Decision", value: tampered ? "APPROVED" : "DECLINED" },
    { label: "Confidence", value: tampered ? "0.92" : "0.41" },
    { label: "Model", value: "risk-v2.3.1" },
  ];
}

/**
 * Chapter 2 — The Quiet Edit (Story Bible Ch.3). The deliberate low point. The user
 * watches (or causes) a decision record change silently, with no trace left behind.
 * Clinical, cold, unsettling — the villain (silent mutability) felt in the gut.
 */
export function TheQuietEdit() {
  const reduced = useExperienceStore((s) => s.reducedMotion);
  const setActive = useExperienceStore((s) => s.setActiveChapter);
  const [tampered, setTampered] = useState(false);
  const tamperedRef = useRef(false);

  const setTamper = (next: boolean) => {
    if (next === tamperedRef.current) return;
    tamperedRef.current = next;
    setTampered(next);
    if (next) audioEngine.cue("tamper");
  };

  const ref = usePinnedTimeline<HTMLElement>({
    scrollLength: SCROLL.quietEdit,
    enabled: !reduced,
    onActivate: () => setActive("the-quiet-edit"),
    onProgress: (p) => setTamper(p > 0.5),
    build: (tl, root) => {
      const lead = root.querySelector(".qe-lead");
      const card = root.querySelector(".qe-card");
      gsap.set(lead, { autoAlpha: 0, y: 24 });
      gsap.set(card, { autoAlpha: 0, y: 30 });
      tl.to(lead, { autoAlpha: 1, y: 0, duration: 0.6, ease: EASE.cinematic }, 0.2);
      tl.to(card, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE.cinematic }, 0.5);
      tl.to({}, { duration: 4 });
    },
    buildStatic: (root) => {
      gsap.set(root.querySelectorAll(".qe-lead, .qe-card"), { autoAlpha: 1, y: 0 });
    },
  });

  return (
    <section ref={ref} aria-label="The quiet edit" className="frame-cinema overflow-hidden bg-void">
      {/* fluorescent clinical wash */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(90% 70% at 50% 30%, color-mix(in oklab, var(--color-doubt) 22%, transparent), transparent 70%)",
        }}
      />

      <div className="relative flex w-[min(92vw,64rem)] flex-col items-center gap-10 px-6">
        <CinematicLine size="headline" className="qe-lead text-center text-paper">
          Every decision leaves a record.
        </CinematicLine>

        <div className="qe-card flex flex-col items-center gap-6">
          <EvidenceRecord
            fields={recordFields(tampered)}
            state="cold"
            footer="sha256: 9f2c4e…a17b   ·   audit log: consistent"
          />

          {!tampered ? (
            <button
              type="button"
              onClick={() => setTamper(true)}
              className="pointer-events-auto text-caption uppercase tracking-[0.25em] text-mist underline-offset-8 transition-colors hover:text-paper hover:underline focus-visible:text-paper focus-visible:outline-none"
            >
              → alter this record
            </button>
          ) : (
            <p className="text-caption uppercase tracking-[0.25em] text-mist">
              the hash is unchanged. the log says nothing happened.
            </p>
          )}
        </div>

        <div
          className={cn(
            "min-h-[3rem] text-center transition-all duration-700",
            tampered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
          )}
        >
          <CinematicLine size="display" className="text-paper">
            And no one would ever know.
          </CinematicLine>
        </div>
      </div>
    </section>
  );
}
