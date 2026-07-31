/**
 * Particle — one ASCII glyph suspended in the fluid. Pooled and recycled:
 * the pool is allocated once and particles are re-spawned in place, so the
 * frame loop never allocates.
 */

import { TAU, gaussian } from "./Utils";

export class Particle {
  alive = false;

  x = 0;
  y = 0;
  vx = 0;
  vy = 0;

  /** age in seconds since spawn */
  age = 0;
  /** total lifetime in seconds */
  life = 1;

  char = ".";
  /** size bucket index (glyphs are batched per bucket to limit font swaps) */
  bucket = 0;
  rot = 0;
  rotVel = 0;
  /** per-particle opacity jitter (0.6..1) */
  alphaJitter = 1;
  /** phase offset so no two particles sway in sync */
  phase = 0;

  spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    char: string,
    bucket: number,
    rng: () => number,
  ): void {
    this.alive = true;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.age = 0;
    this.life = life * (0.7 + rng() * 0.6); // natural lifetime variation
    this.char = char;
    this.bucket = bucket;
    this.rot = gaussian(rng) * 0.5;
    this.rotVel = gaussian(rng) * 0.35;
    this.alphaJitter = 0.6 + rng() * 0.4;
    this.phase = rng() * TAU;
  }

  kill(): void {
    this.alive = false;
  }
}
