"use client";

import { useRef, useState } from "react";
import { EASE } from "@/config/motion.tokens";
import { SCROLL } from "@/config/pacing";
import { gsap } from "@/engines/animation/gsap";
import { usePinnedTimeline } from "@/engines/scene/usePinnedTimeline";
import { CinematicLine } from "@/components/typography/CinematicLine";
import { VideoClip } from "@/components/media/VideoClip";
import { SealMark } from "@/components/visual/SealMark";
import { useExperienceStore } from "@/stores/experience.store";
import { STORIES } from "@/features/chapter-00-opening/opening.data";

/** The emotion clip from each opening story, now re-lit and provable. */
const RELIT = STORIES.map((s) => s.clips[3]);

/**
 * Chapter 7 — The World, Rewritten (Story Bible Ch.8). The human stakes of the
 * opening return, healed: the same scenes, now carrying calm proof. Warmth and
 * verifiability finally coexist. Inspiration and scale.
 */
export function TheWorldRewritten() {
  const reduced = useExperienceStore((s) => s.reducedMotion);
  const setActive = useExperienceStore((s) => s.setActiveChapter);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeRef = useRef(0);

  const setClip = (i: number) => {
    if (i !== activeRef.current) {
      activeRef.current = i;
      setActiveIndex(i);
    }
  };

  const ref = usePinnedTimeline<HTMLElement>({
    scrollLength: SCROLL.worldRewritten,
    enabled: !reduced,
    onActivate: () => setActive("the-world-rewritten"),
    onProgress: (p) => {
      setClip(Math.max(0, Math.min(RELIT.length - 1, Math.floor(p * RELIT.length))));
    },
    build: (tl, root) => {
      const clips = gsap.utils.toArray<HTMLElement>(".wr-clip", root);
      const lead = root.querySelector(".wr-lead");
      const close = root.querySelector(".wr-close");

      gsap.set(clips, { autoAlpha: 0, scale: 1.06 });
      if (clips[0]) gsap.set(clips[0], { autoAlpha: 1 });
      gsap.set([lead, close], { autoAlpha: 0, y: 24 });

      tl.to(lead, { autoAlpha: 1, y: 0, duration: 0.7, ease: EASE.cinematic }, 0.2);

      clips.forEach((clip, i) => {
        const at = 1 + i;
        if (i > 0) {
          const prev = clips[i - 1];
          tl.to(clip, { autoAlpha: 1, duration: 0.8, ease: EASE.hold }, at - 0.4);
          if (prev) tl.to(prev, { autoAlpha: 0, duration: 0.8, ease: EASE.hold }, at - 0.4);
        }
        tl.to(clip, { scale: 1, duration: 1.6, ease: EASE.linear }, i > 0 ? at - 0.4 : 1);
      });

      tl.to(lead, { autoAlpha: 0, duration: 0.5 }, RELIT.length - 0.5);
      tl.to(close, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE.cinematic }, RELIT.length + 0.4);
      tl.to({}, { duration: 1.2 });
    },
    buildStatic: (root) => {
      const clips = gsap.utils.toArray<HTMLElement>(".wr-clip", root);
      const last = clips[clips.length - 1];
      gsap.set(clips, { autoAlpha: 0 });
      if (last) gsap.set(last, { autoAlpha: 1, scale: 1 });
      gsap.set(root.querySelectorAll(".wr-lead"), { autoAlpha: 0 });
      gsap.set(root.querySelectorAll(".wr-close"), { autoAlpha: 1, y: 0 });
    },
  });

  return (
    <section ref={ref} aria-label="The world, rewritten" className="frame-cinema overflow-hidden bg-void">
      <div className="absolute inset-0">
        {RELIT.map((id, i) => (
          <div key={id} className="wr-clip absolute inset-0">
            <VideoClip
              clipId={id}
              active={reduced ? i === RELIT.length - 1 : i === activeIndex}
              warm={i === activeIndex + 1}
            />
          </div>
        ))}
        {/* warmth + verifiable light, married */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 100% at 50% 40%, transparent 45%, rgba(5,6,10,0.6) 100%), radial-gradient(60% 50% at 50% 50%, color-mix(in oklab, var(--color-verify) 8%, transparent), transparent 70%)",
          }}
        />
      </div>

      {/* persistent proof mark — the verifiable now accompanies the human */}
      <span className="pointer-events-none absolute right-8 top-8 flex items-center gap-3 text-verify md:right-12 md:top-12">
        <SealMark size={28} />
        <span className="text-caption uppercase tracking-[0.22em]">verified</span>
      </span>

      <CinematicLine
        size="display"
        className="wr-lead absolute left-1/2 top-1/2 w-[min(90vw,46rem)] -translate-x-1/2 -translate-y-1/2 px-6 text-center text-paper"
      >
        The same world.
      </CinematicLine>

      <div className="wr-close absolute left-1/2 top-1/2 w-[min(92vw,60rem)] -translate-x-1/2 -translate-y-1/2 px-6 text-center">
        <CinematicLine size="cinema" className="text-paper">
          Now every decision can be proven.
        </CinematicLine>
        <CinematicLine size="body-lg" voice="witness" className="mt-6 text-mist">
          A diagnosis you can question. A loan you can appeal. A future you can trust.
        </CinematicLine>
      </div>
    </section>
  );
}
