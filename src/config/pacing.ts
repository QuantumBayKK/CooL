/**
 * Scroll pacing — the single source of truth for how long each chapter pins
 * (as a multiple of viewport height). Centralized so the whole film has a
 * consistent, tunable rhythm. Lower = faster to scroll through.
 *
 * Rule of thumb: ~0.6 viewport-heights per discrete beat the chapter reveals.
 * Keep these tight — a long pin reads as "stuck," which is the #1 cause of the
 * experience feeling slow or inconsistent.
 */
export const SCROLL = {
  coldOpen: 2.8, // 3 overlapping lines
  story: 4.4, // 4 clips + interstitials + question — each clip gets room to breathe
  silence: 0.6, // a held beat, not a void
  realization: 4.0, // 3 lines + network expand + logo
  question: 2.0,
  quietEdit: 3.0,
  turn: 3.2,
  sealedRoom: 2.6,
  witnesses: 3.4,
  proof: 2.6,
  worldRewritten: 3.4, // 5 clips
} as const;
