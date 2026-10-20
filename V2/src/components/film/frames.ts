"use client";

/**
 * Loader for the 1-bit frame sequences in public/film/. Frames are fetched
 * after first paint, in idle time, and cached per sequence so the hero and a
 * later revisit share decoded images.
 */

export interface Sequence {
  readonly dir: string;
  readonly count: number;
  readonly width: number;
  readonly height: number;
}

export const HERO_SEQ: Sequence = { dir: "/film/hero", count: 120, width: 640, height: 360 };
export const RECORDER_SEQ: Sequence = { dir: "/film/recorder", count: 96, width: 640, height: 360 };

export const frameUrl = (s: Sequence, i: number) => `${s.dir}/${String(i + 1).padStart(3, "0")}.png`;

const cache = new Map<string, (HTMLImageElement | null)[]>();

/**
 * Load every frame (optionally every `stride`-th). Calls `onFrame` as frames
 * decode so playback can start before the whole set is in.
 */
export function loadSequence(
  s: Sequence,
  onFrame: (i: number) => void,
  stride = 1,
): { frames: (HTMLImageElement | null)[]; cancel: () => void } {
  let frames = cache.get(s.dir);
  if (!frames) {
    frames = new Array(s.count).fill(null);
    cache.set(s.dir, frames);
  }
  let cancelled = false;
  const order: number[] = [];
  for (let i = 0; i < s.count; i += stride) order.push(i);
  let next = 0;
  const pump = () => {
    if (cancelled) return;
    const batch = order.slice(next, next + 8);
    next += 8;
    for (const i of batch) {
      if (frames![i]) {
        onFrame(i);
        continue;
      }
      const img = new Image();
      img.decoding = "async";
      img.src = frameUrl(s, i);
      img
        .decode()
        .then(() => {
          frames![i] = img;
          if (!cancelled) onFrame(i);
        })
        .catch(() => undefined);
    }
    if (next < order.length) {
      const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
      if (ric) ric(pump);
      else setTimeout(pump, 30);
    }
  };
  pump();
  return {
    frames,
    cancel: () => {
      cancelled = true;
    },
  };
}

/** Nearest loaded frame to `i`, so scrubbing never shows a blank. */
export function nearest(frames: (HTMLImageElement | null)[], i: number): HTMLImageElement | null {
  for (let d = 0; d < frames.length; d++) {
    const a = frames[i - d];
    if (a) return a;
    const b = frames[i + d];
    if (b) return b;
  }
  return null;
}
