/**
 * Physics — the fluid medium. Handles:
 *  - the weighty spring head that follows the cursor (never snaps)
 *  - neighbor coupling via a uniform spatial hash grid:
 *      mild attraction (surface tension), close-range repulsion,
 *      and velocity smoothing (viscosity) so the trail moves as one body
 *
 * Everything is O(n) per frame with a fixed-size grid, zero allocations.
 */

import type { Particle } from "./Particle";

/* ---------------- spring head ---------------- */

export class SpringHead {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  initialized = false;

  /**
   * Under-damped spring toward the target — carries momentum, overshoots
   * a little on direction changes, settles without snapping.
   */
  update(
    targetX: number,
    targetY: number,
    stiffness: number,
    inertia: number,
    dt: number,
  ): void {
    if (!this.initialized) {
      this.x = targetX;
      this.y = targetY;
      this.initialized = true;
      return;
    }
    this.vx += (targetX - this.x) * stiffness * dt;
    this.vy += (targetY - this.y) * stiffness * dt;
    // inertia (0..1): fraction of velocity kept over ~1/8s — frame-rate independent
    const decay = Math.exp(Math.log(Math.max(inertia, 1e-4)) * dt * 8);
    this.vx *= decay;
    this.vy *= decay;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  speed(): number {
    return Math.hypot(this.vx, this.vy);
  }
}

/* ---------------- neighbor field ---------------- */

const CELL = 44; // grid cell size in px — roughly the interaction radius
const GRID_W = 64; // hash dimensions (wraps; fine for this use)
const GRID_H = 40;
const MAX_PER_CELL = 12;

export class NeighborField {
  // flat grid: per cell, particle indices
  private counts = new Int16Array(GRID_W * GRID_H);
  private cells = new Int16Array(GRID_W * GRID_H * MAX_PER_CELL);

  private cellIndex(x: number, y: number): number {
    const cx = ((Math.floor(x / CELL) % GRID_W) + GRID_W) % GRID_W;
    const cy = ((Math.floor(y / CELL) % GRID_H) + GRID_H) % GRID_H;
    return cy * GRID_W + cx;
  }

  build(pool: Particle[]): void {
    this.counts.fill(0);
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i]!;
      if (!p.alive) continue;
      const ci = this.cellIndex(p.x, p.y);
      const n = this.counts[ci]!;
      if (n < MAX_PER_CELL) {
        this.cells[ci * MAX_PER_CELL + n] = i;
        this.counts[ci] = n + 1;
      }
    }
  }

  /**
   * Apply neighbor forces to every particle:
   *  attraction toward the local centroid, repulsion inside `minDist`,
   *  and viscosity (velocity blending) — the "moves like one cloth" part.
   */
  apply(pool: Particle[], viscosity: number, dt: number): void {
    const minDist = 14;
    // kept low: enough cohesion to feel liquid, never enough to make the
    // cloud curl back toward the cursor and orbit it
    const attract = 0.9;
    const repel = 220;
    const viscMix = Math.min(viscosity * dt, 0.35);

    for (let i = 0; i < pool.length; i++) {
      const p = pool[i]!;
      if (!p.alive) continue;

      let sumX = 0;
      let sumY = 0;
      let sumVX = 0;
      let sumVY = 0;
      let n = 0;

      const ci = this.cellIndex(p.x, p.y);
      const count = this.counts[ci]!;
      for (let k = 0; k < count; k++) {
        const j = this.cells[ci * MAX_PER_CELL + k]!;
        if (j === i) continue;
        const q = pool[j]!;
        if (!q.alive) continue;
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > CELL * CELL) continue;
        const d = Math.sqrt(d2) || 1;

        sumX += q.x;
        sumY += q.y;
        sumVX += q.vx;
        sumVY += q.vy;
        n++;

        // close-range repulsion keeps glyphs legible, never clumped
        if (d < minDist) {
          const f = (repel * (1 - d / minDist)) / d;
          p.vx -= dx * f * dt;
          p.vy -= dy * f * dt;
        }
      }

      if (n > 0) {
        // gentle pull toward local centroid — surface tension
        p.vx += ((sumX / n - p.x) * attract * dt) / 1;
        p.vy += ((sumY / n - p.y) * attract * dt) / 1;
        // viscosity: share velocity with the neighborhood
        p.vx += (sumVX / n - p.vx) * viscMix;
        p.vy += (sumVY / n - p.vy) * viscMix;
      }
    }
  }
}

/** Frame-rate independent drag: velocity decays `rate` per second. */
export function applyDrag(p: Particle, rate: number, dt: number): void {
  const f = Math.exp(-rate * dt);
  p.vx *= f;
  p.vy *= f;
}
