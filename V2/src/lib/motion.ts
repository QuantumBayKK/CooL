/**
 * Motion primitives — anime.js v4.
 *
 * Everything here is built around one rule: never run a permanent animation on
 * the main thread. Entrances are one-shot (they animate, then stop forever);
 * ambient loops (float / sweep / shimmer) live in CSS so the compositor owns
 * them. That is the difference between a site that scrolls at 120fps on a
 * phone and one that stutters.
 */

export const FLUID = "cubicBezier(0.16, 1, 0.3, 1)";

/**
 * How long the intro's backlight takes to die.
 *
 * Lives here — in a module with no three.js dependency — because both halves of
 * the intro need it: the WebGL scene fades its lights over this window, and the
 * DOM fades its bloom layer over the same one. Two copies of the number would
 * drift and the light would visibly die in two stages.
 *
 * Kept short on purpose: the whole cold open is budgeted at ~2.5s, and the
 * light dying is the beat that pays for the flight, not a feature of its own.
 */
export const INTRO_DARK_MS = 240;
export const OUT_EXPO = "outExpo";
export const SOFT = "cubicBezier(0.33, 1, 0.68, 1)";

/** Read the user's motion preference. Safe to call during render (SSR-guarded). */
export function prefersReduced(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Coarse pointer / small screen — used to dial animation cost down on phones. */
export function isPhone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

/**
 * Wait for the next idle moment (or a deadline) before doing non-urgent setup.
 * Keeps first paint clean on slow phones.
 */
export function whenIdle(fn: () => void, timeout = 400): () => void {
  if (typeof window === "undefined") return () => {};
  const ric = (
    window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    }
  ).requestIdleCallback;
  if (ric) {
    const id = ric(fn, { timeout });
    return () => {
      const cic = (
        window as unknown as { cancelIdleCallback?: (h: number) => void }
      ).cancelIdleCallback;
      cic?.(id);
    };
  }
  const t = window.setTimeout(fn, 1);
  return () => window.clearTimeout(t);
}

/**
 * Smoothly scroll the window to an absolute Y using the browser's own smooth
 * scroller, and resolve when it settles. `scrollend` is the accurate signal;
 * the timeout is the fallback for engines that don't ship it yet.
 */
export function scrollToY(top: number, maxMs = 1100): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener("scrollend", finish);
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(finish, maxMs);
    window.addEventListener("scrollend", finish, { once: true });
    window.scrollTo({
      top,
      behavior: prefersReduced() ? "auto" : "smooth",
    });
    if (prefersReduced()) finish();
  });
}
