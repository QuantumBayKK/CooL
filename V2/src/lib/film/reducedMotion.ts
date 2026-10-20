/**
 * Reduced-motion and device-capability helpers for the film-led site.
 *
 * Every animation system on the site — canvas debris, frame sequences, scroll
 * scrubbing, the boot overlay, the cursor — asks these before it starts, so
 * "reduce motion" is one decision applied everywhere rather than a flag each
 * component remembers (or forgets) to check.
 */

export interface MotionProfile {
  /** prefers-reduced-motion: reduce. No particles, shake, scrub or boot. */
  readonly reduced: boolean;
  /** Low-power device or Save-Data: fewer particles, no heavy scenes. */
  readonly lowPower: boolean;
  /** A precise pointer (mouse/trackpad), so a custom cursor is appropriate. */
  readonly finePointer: boolean;
}

export const STATIC_PROFILE: MotionProfile = {
  reduced: true,
  lowPower: true,
  finePointer: false,
};

interface NavigatorLike {
  readonly hardwareConcurrency?: number;
  readonly connection?: { readonly saveData?: boolean };
}

/** Pure so it can be unit-tested without a DOM. */
export function profileFrom(
  matches: (query: string) => boolean,
  nav: NavigatorLike,
): MotionProfile {
  const cores = nav.hardwareConcurrency ?? 8;
  return {
    reduced: matches("(prefers-reduced-motion: reduce)"),
    lowPower: cores <= 4 || nav.connection?.saveData === true,
    finePointer: matches("(pointer: fine)") && matches("(hover: hover)"),
  };
}

export function readMotionProfile(): MotionProfile {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return STATIC_PROFILE;
  }
  return profileFrom(
    (q) => window.matchMedia(q).matches,
    navigator as unknown as NavigatorLike,
  );
}
