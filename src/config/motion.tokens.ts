/**
 * Motion tokens — the single source of truth for timing & easing (TS side).
 * Mirrors the CSS variables in globals.css and the Creative Direction System §4.
 * Components and the Animation Engine read from here; nothing hand-rolls values.
 */

/** Durations in seconds (GSAP-native unit). */
export const DURATION = {
  instant: 0.12,
  fast: 0.24,
  base: 0.4,
  slow: 0.8,
  cinematic: 1.4,
  monumental: 2.4,
} as const;

/**
 * Easing — GSAP-native ease strings (no plugin needed). Organic & weighted only.
 * `linear`/`none` is allowed ONLY for scrub-locked continuous moves (e.g. slow zoom);
 * playful springs/bounces are intentionally absent (Story Bible Rule 11 / CDS §4.2).
 * CSS-side equivalents live as cubic-bezier vars in globals.css.
 */
export const EASE = {
  /** Decisive arrival — entrances. (~cubic-bezier(0.16,1,0.3,1)) */
  cinematic: "expo.out",
  /** Weighted transform — things with mass. (~cubic-bezier(0.65,0,0.35,1)) */
  mass: "power3.inOut",
  /** Gentle hold for monumental moments. (~cubic-bezier(0.4,0,0.2,1)) */
  hold: "power2.inOut",
  /** Continuous, scrub-locked motion only (slow zooms). */
  linear: "none",
} as const;

/** Stagger presets — express sequence/assembly, never decoration. */
export const STAGGER = {
  tight: 0.06,
  base: 0.12,
  reveal: 0.2,
} as const;

export type DurationToken = keyof typeof DURATION;
export type EaseToken = keyof typeof EASE;
