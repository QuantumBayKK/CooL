"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useRef, type ReactNode } from "react";
import type { MotionValue } from "motion/react";

import { cn } from "@/lib/utils";
import { usePulse } from "./motion";

/**
 * A pinned scroll stage.
 *
 * The shape every act in the trailer uses: a tall track that the reader
 * scrolls through, and a viewport-height panel pinned inside it that does not
 * move. Scrolling the track advances `progress` from 0 to 1 while the panel
 * stays put, which is what converts vertical scroll into a timeline.
 *
 * Two details that are easy to get wrong and very visible when you do:
 *
 * · The offset is `start start → end end`, not the default. It means progress
 *   hits 0 exactly when the panel pins and 1 exactly when it unpins, so no part
 *   of the animation plays off-screen above or below. With the default offset a
 *   third of every act happens where nobody can see it.
 *
 * · `length` is in viewport heights and is the act's pacing dial, not its
 *   content size. A longer track does not add content — it slows the same
 *   content down. Three is brisk, five is stately; past about six the reader
 *   starts to feel trapped in a section that will not release the scroll.
 *
 * Reduced motion drops the pin entirely: the track collapses to one screen, the
 * panel is static, and `progress` is frozen at 1 so every child renders its
 * finished state. That is the honest reading of the setting — the reader gets
 * the diagram, fully drawn, with no movement at all.
 */
export function Stage({
  children,
  length = 4,
  lengthSm,
  className,
  id,
  label,
}: {
  children: (progress: MotionValue<number>) => ReactNode;
  /** Track height in viewport heights, ≥768px. */
  length?: number;
  /** Track height on phones. Defaults to `length` less one, floored at 2.5. */
  lengthSm?: number;
  className?: string;
  id?: string;
  /** Chapter marker, top-left of the pinned panel. */
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Called unconditionally — hooks cannot be conditional, and a frozen value is
  // cheaper than a second component tree for the reduced-motion path.
  const frozen = useMotionValue(1);
  const progress = reduced ? frozen : scrollYProgress;

  if (reduced) {
    return (
      <section id={id} className={cn("relative border-t border-line", className)}>
        <div className="relative grid min-h-dvh place-items-center overflow-clip px-5 py-16">
          {label && <ChapterLabel>{label}</ChapterLabel>}
          {children(progress)}
        </div>
      </section>
    );
  }

  return (
    <section
      id={id}
      ref={ref}
      className={cn("stage-track relative border-t border-line", className)}
      style={
        {
          "--stage-len": length,
          "--stage-len-sm": lengthSm ?? Math.max(2.5, length - 1),
        } as React.CSSProperties
      }
    >
      <div className="sticky top-0 grid h-dvh place-items-center overflow-clip px-5">
        {label && <ChapterLabel>{label}</ChapterLabel>}
        <ScrubBar progress={progress} />
        {children(progress)}
      </div>
    </section>
  );
}

/* ── chrome ───────────────────────────────────────────────────────────────── */

/**
 * The chapter marker. Sits under the sticky header, aligned to the page
 * gutter rather than the panel, so it reads as a fixed annotation on the
 * viewport while the artwork moves inside it.
 */
function ChapterLabel({ children }: { children: ReactNode }) {
  return (
    <p className="pointer-events-none absolute left-5 top-20 z-10 flex items-center gap-3 text-label uppercase text-ink-subtle sm:left-8 lg:left-10">
      <span aria-hidden className="h-px w-6 bg-line-strong" />
      {children}
    </p>
  );
}

/**
 * A hairline that fills as the act plays.
 *
 * This exists to answer the only question a pinned section reliably provokes —
 * "is this stuck?". One glance at a partially filled rule and the reader knows
 * the page is working and roughly how much of the act is left. Without it, a
 * pinned stage that does not respond instantly to a small scroll reads as a
 * broken page, and the reader's next move is the back button.
 */
function ScrubBar({ progress }: { progress: MotionValue<number> }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-line"
    >
      <motion.div
        className="h-full origin-left bg-accent"
        style={{ scaleX: progress }}
      />
    </div>
  );
}

/* ── Swing ────────────────────────────────────────────────────────────────── */

/**
 * Carries a flat composition through 3D space as the act plays.
 *
 * The diagram starts laid back and turned away, and rotates up to face the
 * reader as it finishes drawing itself. That single move is what separates a
 * schematic that fades in from one that *arrives* — and it costs nothing,
 * because rotation and scale are compositor properties: the SVG inside is
 * rasterised once and the GPU turns the texture.
 *
 * Three things make it read as depth rather than as skew:
 *
 * · `perspective` on the wrapper, not the child. Perspective set on the same
 *   element it transforms is applied after the rotation and produces a flat
 *   shear — the classic "why does my 3D look like a parallelogram".
 * · It rotates on two axes at once. A single-axis tilt reads as a hinge; the
 *   second axis is what puts a vanishing point in the picture.
 * · It ends at zero. The composition has to become perfectly flat and
 *   head-on by the time the reader is meant to read it, or the labels stay
 *   trapezoidal and the whole thing is decoration.
 *
 * Reduced motion renders the children with no wrapper at all.
 */
export function Swing({
  progress,
  children,
  className,
  stops = [0, 0.3, 0.68, 1],
  rotateX = [26, 11, 0, -7],
  rotateY = [-22, -8, 0, 6],
  scale = [0.82, 0.93, 1, 0.97],
  perspective = 1800,
}: {
  progress: MotionValue<number>;
  children: ReactNode;
  className?: string;
  stops?: number[];
  rotateX?: number[];
  rotateY?: number[];
  scale?: number[];
  perspective?: number;
}) {
  const reduced = useReducedMotion();

  // Hooks run unconditionally; the reduced branch simply ignores them.
  const rx = useTransform(progress, stops, rotateX);
  const ry = useTransform(progress, stops, rotateY);
  const sc = useTransform(progress, stops, scale);

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <div className={className} style={{ perspective: `${perspective}px` }}>
      <motion.div style={{ rotateX: rx, rotateY: ry, scale: sc }}>
        {children}
      </motion.div>
    </div>
  );
}

/* ── captions ─────────────────────────────────────────────────────────────── */

export interface Beat {
  /** Fade in over [0]→[1], hold to [2], fade out by [3]. */
  at: readonly [number, number, number, number];
  title: ReactNode;
  body?: ReactNode;
}

/**
 * The line of copy that swaps as the act plays.
 *
 * Every beat is absolutely positioned in the same box and cross-fades with its
 * neighbours, so the artwork below never reflows as the words change. Laying
 * these out in normal flow instead — the obvious first attempt — makes the
 * whole stage jump by the height difference every time a two-line caption
 * follows a one-line one.
 *
 * Beats are meant to overlap by a few percent. The gap between "one has fully
 * left" and "the next begins" is perceptible as a blank moment; a short overlap
 * reads as one thought becoming the next.
 */
export function Captions({
  progress,
  beats,
  className,
}: {
  progress: MotionValue<number>;
  beats: readonly Beat[];
  className?: string;
}) {
  const weight = (b: Beat) =>
    (typeof b.title === "string" ? b.title.length : 40) +
    (typeof b.body === "string" ? b.body.length : 0);
  const tallest = beats.reduce((a, b) => (weight(b) > weight(a) ? b : a), beats[0]!);

  return (
    <div
      className={cn(
        "pointer-events-none relative mx-auto w-full max-w-[46rem] text-center",
        className,
      )}
    >
      {/* Reserves the TALLEST beat's height, not the first one's.
          Sizing on `beats[0]` is the obvious version and it is wrong on narrow
          screens: a later, longer beat wraps to more lines than the reserve,
          overflows the box and lands on top of the artwork below. Longest by
          character count is a sound proxy for tallest here, because every beat
          wraps at the same measure in the same two type sizes. */}
      <div aria-hidden className="invisible">
        <p className="text-h2">{tallest.title}</p>
        <p className="mt-3 text-lead">{tallest.body ?? " "}</p>
      </div>

      {beats.map((beat, i) => (
        <CaptionBeat key={i} progress={progress} beat={beat} />
      ))}
    </div>
  );
}

function CaptionBeat({
  progress,
  beat,
}: {
  progress: MotionValue<number>;
  beat: Beat;
}) {
  const opacity = usePulse(progress, ...beat.at);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-start"
      style={{ opacity }}
    >
      <h2 className="text-h2 text-balance">{beat.title}</h2>
      {beat.body && (
        <p className="mt-3 max-w-[42rem] text-lead text-ink-muted">{beat.body}</p>
      )}
    </motion.div>
  );
}
