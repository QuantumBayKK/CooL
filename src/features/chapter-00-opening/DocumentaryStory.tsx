"use client";

import { useRef, useState } from "react";
import { EASE } from "@/config/motion.tokens";
import { SCROLL } from "@/config/pacing";
import { gsap } from "@/engines/animation/gsap";
import { usePinnedTimeline } from "@/engines/scene/usePinnedTimeline";
import { CinematicLine } from "@/components/typography/CinematicLine";
import { VideoClip } from "@/components/media/VideoClip";
import { useExperienceStore } from "@/stores/experience.store";
import type { StoryBeat } from "./opening.data";

/**
 * A single documentary story (Opening spec): 4 clips that crossfade with a slow push,
 * interstitial lines, and a closing statement. Only the visible clip decodes (the next
 * is warmed) so crossfades stay smooth.
 */
export function DocumentaryStory({ story }: { story: StoryBeat }) {
  const reduced = useExperienceStore((s) => s.reducedMotion);
  const setChapter = useExperienceStore((s) => s.setActiveChapter);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeRef = useRef(0);

  const setActive = (i: number) => {
    if (i !== activeRef.current) {
      activeRef.current = i;
      setActiveIndex(i);
    }
  };

  const ref = usePinnedTimeline<HTMLElement>({
    scrollLength: SCROLL.story,
    enabled: !reduced,
    onActivate: () => setChapter("opening"),
    onProgress: (p) => {
      const len = story.clips.length;
      setActive(Math.max(0, Math.min(len - 1, Math.floor(p * len + 0.12))));
    },
    build: (tl, root) => {
      const clips = gsap.utils.toArray<HTMLElement>(".story-clip", root);
      const lines = gsap.utils.toArray<HTMLElement>(".story-line", root);
      const question = root.querySelector<HTMLElement>(".story-question");

      gsap.set(clips, { autoAlpha: 0, scale: 1.05 });
      if (clips[0]) gsap.set(clips[0], { autoAlpha: 1 });
      gsap.set(lines, { autoAlpha: 0, y: 20 });
      if (question) gsap.set(question, { autoAlpha: 0, y: 20 });

      // Long, soft dissolves on integer beats + a slow continuous push. The wide
      // overlap (incoming rises while outgoing falls over the same window) keeps the
      // cut from ever reading as a hard gradient seam.
      clips.forEach((clip, i) => {
        if (i > 0) {
          const prev = clips[i - 1];
          tl.to(clip, { autoAlpha: 1, duration: 1.0, ease: EASE.hold }, i - 0.5);
          if (prev) tl.to(prev, { autoAlpha: 0, duration: 1.0, ease: EASE.hold }, i - 0.5);
        }
        tl.to(clip, { scale: 1, duration: 1.8, ease: EASE.linear }, i > 0 ? i - 0.5 : 0);
      });

      // Interstitial lines — one at a time, each fully clearing before the next so
      // no two lines ever share the frame.
      const STEP = 1.1;
      lines.forEach((line, i) => {
        const at = 0.5 + i * STEP;
        tl.to(line, { autoAlpha: 1, y: 0, duration: 0.5, ease: EASE.cinematic }, at);
        tl.to(line, { autoAlpha: 0, y: -14, duration: 0.45, ease: EASE.mass }, at + 0.55);
      });

      // Closing statement over the final (emotion) clip — after the last line is gone.
      if (question) {
        const qAt = Math.max(clips.length - 0.4, 0.5 + lines.length * STEP);
        tl.to(question, { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE.cinematic }, qAt);
      }
      tl.to({}, { duration: 0.9 });
    },
    buildStatic: (root) => {
      const clips = gsap.utils.toArray<HTMLElement>(".story-clip", root);
      const last = clips[clips.length - 1];
      gsap.set(clips, { autoAlpha: 0 });
      if (last) gsap.set(last, { autoAlpha: 1, scale: 1 });
      gsap.set(root.querySelectorAll(".story-line"), { autoAlpha: 0 });
      gsap.set(root.querySelectorAll(".story-question"), { autoAlpha: 1, y: 0 });
    },
  });

  const lastQuestionIndex = story.question.length - 1;

  return (
    <section
      ref={ref}
      aria-label={`${story.key} story`}
      className="frame-cinema overflow-hidden bg-void"
    >
      <div className="absolute inset-0">
        {story.clips.map((id, i) => (
          <div key={id} className="story-clip absolute inset-0">
            <VideoClip
              clipId={id}
              active={reduced ? i === story.clips.length - 1 : i === activeIndex}
              warm={i === activeIndex + 1}
            />
          </div>
        ))}
        {/* Gentle cinematic scrim — only enough to seat the text, with a soft
            falloff so there's no hard gradient band between the dark and the clip. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(5,6,10,0.45) 0%, rgba(5,6,10,0) 26%, rgba(5,6,10,0) 60%, rgba(5,6,10,0.55) 100%)",
          }}
        />
      </div>

      {/* The animated lines + question are aria-hidden: the sr-only transcript below
          reads the whole story once, in order, without the scrub choreography. */}
      {story.lines.map((line) => (
        <CinematicLine
          key={line}
          ariaHidden
          size="display"
          className="story-line absolute left-1/2 top-1/2 w-[min(90vw,46rem)] -translate-x-1/2 -translate-y-1/2 px-6 text-center text-paper"
        >
          {line}
        </CinematicLine>
      ))}

      <div
        aria-hidden
        className="story-question absolute left-1/2 top-1/2 w-[min(92vw,56rem)] -translate-x-1/2 -translate-y-1/2 px-6 text-center"
      >
        {story.question.map((q, i) => (
          <CinematicLine
            key={q}
            as="span"
            size={i === lastQuestionIndex ? "cinema" : "headline"}
            className="block text-paper"
          >
            {q}
          </CinematicLine>
        ))}
      </div>

      <p className="sr-only">
        {story.lines.join(" ")} {story.question.join(" ")}
      </p>
    </section>
  );
}
