/**
 * Utils — small math helpers shared by the trail system.
 * Everything here is allocation-free and frame-loop safe.
 */

export const TAU = Math.PI * 2;

export const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v;

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/**
 * Frame-rate independent exponential damping.
 * Returns the interpolation factor for this frame:
 *   x = lerp(x, target, damp(rate, dt))
 * `rate` ≈ how quickly it converges (higher = snappier).
 */
export const damp = (rate: number, dt: number): number =>
  1 - Math.exp(-rate * dt);

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Deterministic 32-bit PRNG (mulberry32) — stable, seedable, fast. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Approximate gaussian sample in [-1, 1] (sum of uniforms, cheap). */
export const gaussian = (rng: () => number): number =>
  (rng() + rng() + rng()) / 1.5 - 1;
