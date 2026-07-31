/**
 * Configuration — every tunable of the liquid-ASCII trail in one place.
 * These map 1:1 to the component props (and to Framer property controls —
 * see the control map at the bottom of CursorTrail.tsx).
 */

export type BlendMode = "normal" | "multiply" | "screen" | "plus-lighter";

export interface TrailConfig {
  /** max particles alive at once (pooled, never reallocated) */
  particleCount: number;
  /** seconds a particle lives before it has fully faded */
  trailLength: number;
  /** additional fade-out duration shaping the tail of a particle's life */
  fadeTime: number;

  /** px of head travel per emitted particle (lower = denser trail) */
  smokeAmount: number;
  /** emission spread around the cursor head, px */
  cursorRadius: number;

  /** spring stiffness pulling the head toward the real cursor */
  springStrength: number;
  /** velocity retention of the head (0..1, higher = heavier feel) */
  inertia: number;

  /** per-second velocity decay applied to particles */
  drag: number;
  /** how strongly particles blend velocity with neighbors (0..1/s) */
  viscosity: number;

  /** curl-noise field scale (bigger = broader swirls) */
  noiseScale: number;
  /** curl-noise force strength, px/s² */
  noiseStrength: number;
  /** how fast the noise field itself evolves */
  driftSpeed: number;

  /** ripple outward impulse strength */
  rippleStrength: number;
  /** ripple propagation rate (1/s) */
  rippleSpeed: number;
  /** ripple max radius, px */
  rippleRadius: number;

  /** glyph palette, weighted toward the front */
  characters: string;
  /** base glyph size, px */
  charSize: number;
  /** overall trail opacity 0..1 */
  opacity: number;
  /** CSS color of the glyphs */
  color: string;
  /** canvas composite mode against the page */
  blendMode: BlendMode;
}

export const DEFAULT_CONFIG: TrailConfig = {
  particleCount: 240,
  trailLength: 1.15, // short-lived: glyphs die about halfway down the stroke
  fadeTime: 0.5,

  smokeAmount: 9,
  cursorRadius: 12,

  springStrength: 110,
  inertia: 0.9,

  drag: 2.0, // a touch more drag → glyphs settle sooner, calmer
  viscosity: 2.2,

  noiseScale: 0.004,
  noiseStrength: 13, // subtler drift — a slow breath, not a gust
  driftSpeed: 0.24,

  rippleStrength: 52, // gentle water, not a splash
  rippleSpeed: 3.0,
  rippleRadius: 180,

  characters: "·.:+*°~^",
  charSize: 13,
  opacity: 0.5, // softer presence — noticed, never loud
  color: "#44505c",
  blendMode: "multiply",
};
