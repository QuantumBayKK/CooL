/**
 * Motion tokens for the film-led site. One place for timings so the nav,
 * route wipe, impacts and reveals feel like one instrument.
 */
export const MOTION = {
  /** Mega-menu drop. */
  menu: 200,
  /** Route wipe, each half. */
  wipe: 420,
  /** Reduced-motion stand-in for an impact. */
  inversionFlash: 120,
  /** Minimum gap between two full-intensity impacts. */
  impactCooldown: 400,
  /** Hero frame-sequence playback rate. */
  heroFps: 12,
  /** Max device pixel ratio for any canvas. */
  maxDpr: 2,
  ease: "cubic-bezier(.2,.7,0,1)",
} as const;
