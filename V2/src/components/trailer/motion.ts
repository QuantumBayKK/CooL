"use client";

import { useTransform, type MotionValue } from "motion/react";
import { useEffect, useState } from "react";

/**
 * The trailer's motion vocabulary.
 *
 * This is deliberately a *second* vocabulary, separate from `ui/motion.tsx`,
 * and the split is worth defending because the two look contradictory side by
 * side: one caps every animation at 240ms and 8px, the other rotates a slab
 * through 40 degrees over four viewport heights.
 *
 * They obey different clocks.
 *
 *   UI motion spends the reader's time. It happens *at* them, unrequested,
 *   while they wait for a menu or a panel — so it must be over before they
 *   notice it started.
 *
 *   Trailer motion spends the reader's scroll. Every value in here is a pure
 *   function of scroll position: nothing advances on a timer, nothing plays
 *   on its own, and the reader can stop, reverse or skim at whatever speed
 *   they like. A long timeline costs them nothing, because they are the clock.
 *
 * The practical rule that falls out: **no `animate` on a timer inside a
 * pinned stage.** If it moves, it moves because the page scrolled. The one
 * exception is the loader, which has no scroll to attach to.
 */

/** The trailer curve. Same monotonic family as `--ease-out`, longer tail. */
export const CINE_EASE = [0.16, 0.84, 0.32, 1] as const;

/**
 * Is the viewport wide enough for the side-by-side compositions? (`lg`)
 *
 * A media query in JS, because a couple of the acts change their *choreography*
 * and not just their layout at this breakpoint — the receipt slab slides left
 * to clear space for a stack of cards that only exists on wide screens, and on
 * a phone that same slide would just shove it off-centre for no reason. CSS can
 * move an element; it cannot rewrite a keyframe range.
 *
 * Starts `false` and corrects after mount. That is deliberate rather than sloppy:
 * the server cannot know the viewport, so any other initial value would be a
 * guess that hydration has to undo. It affects animation only — never markup —
 * so there is nothing for React to mismatch on.
 */
export function useIsWide(query = "(min-width: 1024px)") {
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setWide(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [query]);

  return wide;
}

/**
 * ── why every helper below uses the callback form of `useTransform` ──
 *
 * The obvious way to write these is the range form:
 *
 *     useTransform(p, [a, b], [0, 1])
 *
 * Do not. It is silently miscompiled for `opacity`.
 *
 * Motion looks at range-form transforms of a scroll value and, when the result
 * is expressible as CSS keyframes, hands it to the browser as a native WAAPI
 * animation driven by a `ScrollTimeline` so it can run off the main thread.
 * `opacity` qualifies. A composite `transform` built from four separate values
 * does not, so it stays on the JS path.
 *
 * That split is the bug. In a pinned stage the two paths disagree about what
 * the timeline is: the JS path uses this stage's `offset: start start → end
 * end`, while the generated ScrollTimeline gets the scroller's own default
 * range. The result is a card whose position tracks the scroll correctly while
 * its opacity runs backwards and fades the whole thing out — measured on the
 * receipt slab as opacity 0.99 → 0.55 → 0.09 across an act where it should
 * have been a flat 1.0, with `getAnimations()` showing a stray 1000ms
 * `opacity: 0 → 1` animation nobody asked for.
 *
 * A callback transform cannot be expressed as keyframes, so Motion never
 * accelerates it and both paths stay on the same clock. The cost is that these
 * opacities are set from JS each frame — which is what the transforms beside
 * them were already doing, so it changes nothing about the frame budget.
 */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Carve a sub-window out of a 0→1 timeline: flat 0 before `a`, ramping to a
 * flat 1 after `b`.
 *
 * Every act is written as a set of overlapping windows over one stage progress
 * value rather than as a state machine with discrete steps. Overlap is the
 * whole point: if a connector finishes drawing at exactly the moment its box
 * starts scaling, the eye reads two events. If they overlap by a third, it
 * reads one continuous movement — which is the difference between motion
 * graphics and a slideshow.
 */
export function useWindow(p: MotionValue<number>, a: number, b: number) {
  return useTransform(p, (v) => (b === a ? (v >= b ? 1 : 0) : clamp01((v - a) / (b - a))));
}

/**
 * Piecewise-linear interpolation over arbitrary stops, callback-form.
 *
 * The general case of `useWindow` — use it for any multi-stop **opacity**
 * timeline, for the reason in the block comment above. Transform properties
 * (`x`, `scale`, `rotateY`…) are safe in the range form and read better there,
 * so they keep it.
 */
export function useRamp(
  p: MotionValue<number>,
  stops: readonly number[],
  values: readonly number[],
) {
  return useTransform(p, (v) => {
    if (v <= stops[0]!) return values[0]!;
    for (let i = 1; i < stops.length; i++) {
      const lo = stops[i - 1]!;
      const hi = stops[i]!;
      if (v <= hi) {
        const t = hi === lo ? 1 : (v - lo) / (hi - lo);
        return values[i - 1]! + t * (values[i]! - values[i - 1]!);
      }
    }
    return values[values.length - 1]!;
  });
}

/** A window that rises, holds, then falls — for things that appear and leave. */
export function usePulse(
  p: MotionValue<number>,
  a: number,
  b: number,
  c: number,
  d: number,
) {
  return useTransform(p, (v) => {
    if (v <= a || v >= d) return 0;
    if (v < b) return clamp01((v - a) / (b - a));
    if (v <= c) return 1;
    return clamp01((d - v) / (d - c));
  });
}

/**
 * The i-th window of a staggered group.
 *
 * `span` is the whole group's budget on the parent timeline; each item takes
 * `hold` of it and they are spread evenly across the remainder. Returns the
 * pair to hand to `useWindow`.
 *
 * The stagger is what makes four boxes read as "these arrived in order" rather
 * than "four boxes appeared". Order is the message here — the hierarchy is
 * built by the pipeline, not discovered all at once.
 */
export function stagger(
  i: number,
  count: number,
  [start, end]: readonly [number, number],
  hold = 0.55,
): [number, number] {
  const span = end - start;
  const width = span * hold;
  const step = count > 1 ? (span - width) / (count - 1) : 0;
  const a = start + i * step;
  return [a, a + width];
}
