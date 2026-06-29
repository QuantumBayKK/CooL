/**
 * Designed breakpoints (not just scaling) — mirrors Technical Architecture §8.
 * Each tier receives intentional layout/motion/3D decisions.
 */
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  laptop: 1024,
  desktop: 1440,
  cinema: 1920,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** Media query string for a min-width tier. */
export function minWidth(bp: Breakpoint): string {
  return `(min-width: ${BREAKPOINTS[bp]}px)`;
}
