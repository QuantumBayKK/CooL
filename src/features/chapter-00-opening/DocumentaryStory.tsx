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

      // Gentle opacity crossfades on integer beats + a slow continuous push.
      clips.forEach((clip, i) => {
        if (i > 0) {
          const prev = clips[i - 1];
          tl.to(clip, { autoAlpha: 1, duration: 0.7, ease: EASE.hold }, i - 0.35);
          if (prev) tl.to(prev, { autoAlpha: 0, duration: 0.7, ease: EASE.hold }, i - 0.35);
        }
        tl.to(clip, { scale: 1, duration: 1.5, ease: EASE.linear }, i > 0 ? i - 0.35 : 0);
      });

      // Interstitial lines across the early clips.
      lines.forEach((line, i) => {
        const at = 0.4 + (i * (clips.length - 1)) / Math.max(1, lines.length);
        tl.to(line, { autoAlpha: 1, y: 0, duration: 0.45, ease: EASE.cinematic }, at);
        tl.to(line, { autoAlpha: 0, y: -14, duration: 0.45, ease: EASE.mass }, at + 0.65);
      });

      // Closing statement over the final (emotion) clip.
      if (question) {
        tl.to(question, { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE.cinematic }, clips.length - 0.6);
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
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 100% at 50% 38%, transparent 42%, rgba(5,6,10,0.62) 100%)",
          }}
        />
      </div>

      {story.lines.map((line) => (
        <CinematicLine
          key={line}
          size="display"
          className="story-line absolute left-1/2 top-1/2 w-[min(90vw,46rem)] -translate-x-1/2 -translate-y-1/2 px-6 text-center text-paper"
        >
          {line}
        </CinematicLine>
      ))}

      <div className="story-question absolute left-1/2 top-1/2 w-[min(92vw,56rem)] -translate-x-1/2 -translate-y-1/2 px-6 text-center">
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
