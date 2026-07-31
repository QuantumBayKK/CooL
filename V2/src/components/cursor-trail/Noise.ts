/**
 * Noise — classic 3D Perlin gradient noise (x, y, time) plus a curl field
 * derived from it. Curl noise is what gives the trail its "smoke suspended
 * underwater" quality: divergence-free flow, so particles swirl instead of
 * clumping or scattering.
 */

import { createRng } from "./Utils";

const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export class PerlinNoise {
  private perm: Uint8Array;

  constructor(seed = 1337) {
    const rng = createRng(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    // Fisher–Yates shuffle
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = p[i]!;
      p[i] = p[j]!;
      p[j] = tmp;
    }
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255]!;
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    // 12 gradient directions, branchless-ish
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  /** 3D Perlin noise in [-1, 1]. */
  noise3(x: number, y: number, z: number): number {
    const p = this.perm;
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = fade(x);
    const v = fade(y);
    const w = fade(z);

    const A = p[X]! + Y;
    const AA = p[A & 511]! + Z;
    const AB = p[(A + 1) & 511]! + Z;
    const B = p[(X + 1) & 511]! + Y;
    const BA = p[B & 511]! + Z;
    const BB = p[(B + 1) & 511]! + Z;

    return lerp(
      lerp(
        lerp(this.grad(p[AA & 511]!, x, y, z), this.grad(p[BA & 511]!, x - 1, y, z), u),
        lerp(this.grad(p[AB & 511]!, x, y - 1, z), this.grad(p[BB & 511]!, x - 1, y - 1, z), u),
        v,
      ),
      lerp(
        lerp(
          this.grad(p[(AA + 1) & 511]!, x, y, z - 1),
          this.grad(p[(BA + 1) & 511]!, x - 1, y, z - 1),
          u,
        ),
        lerp(
          this.grad(p[(AB + 1) & 511]!, x, y - 1, z - 1),
          this.grad(p[(BB + 1) & 511]!, x - 1, y - 1, z - 1),
          u,
        ),
        v,
      ),
      w,
    );
  }

  /**
   * 2D curl of the noise field at (x, y, t) — a divergence-free flow vector.
   * Written into `out` to avoid allocations in the frame loop.
   */
  curl2(x: number, y: number, t: number, out: { x: number; y: number }): void {
    const e = 0.35; // finite-difference epsilon in noise space
    const dy = this.noise3(x, y + e, t) - this.noise3(x, y - e, t);
    const dx = this.noise3(x + e, y, t) - this.noise3(x - e, y, t);
    out.x = dy / (2 * e);
    out.y = -dx / (2 * e);
  }
}
