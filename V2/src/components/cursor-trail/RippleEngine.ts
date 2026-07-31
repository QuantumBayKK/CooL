/**
 * RippleEngine — expanding pressure waves in the fluid.
 *
 * Not linear circles: each ripple's radius follows an elastic saturation
 * curve (fast start, asymptotic settle), its band carries a damped
 * oscillation (wave interference), and a quieter secondary ripple echoes
 * behind the first — the "touching still water" profile.
 *
 * Pooled: a fixed array of ripple slots, recycled oldest-first.
 */

import type { Particle } from "./Particle";

const MAX_RIPPLES = 10;

interface Ripple {
  alive: boolean;
  x: number;
  y: number;
  age: number;
  strength: number;
}

export class RippleEngine {
  private ripples: Ripple[] = Array.from({ length: MAX_RIPPLES }, () => ({
    alive: false,
    x: 0,
    y: 0,
    age: 0,
    strength: 0,
  }));

  spawn(x: number, y: number, strength: number): void {
    // recycle: first dead slot, else the oldest
    let slot: Ripple | null = null;
    let oldest: Ripple = this.ripples[0]!;
    for (const r of this.ripples) {
      if (!r.alive) {
        slot = r;
        break;
      }
      if (r.age > oldest.age) oldest = r;
    }
    const r = slot ?? oldest;
    r.alive = true;
    r.x = x;
    r.y = y;
    r.age = 0;
    r.strength = strength;
  }

  /** advance ripple clocks; retire spent ones */
  update(dt: number, maxAge: number): void {
    for (const r of this.ripples) {
      if (!r.alive) continue;
      r.age += dt;
      if (r.age > maxAge) r.alive = false;
    }
  }

  /**
   * Apply every live ripple's force to one particle.
   * Radial push at the wavefront + a slight tangential shear so the field
   * bends rather than just dilates. Overshoot + ease-back come from the
   * damped sinusoid.
   */
  applyTo(
    p: Particle,
    rippleRadius: number,
    rippleSpeed: number,
    rippleStrength: number,
    dt: number,
  ): void {
    for (const r of this.ripples) {
      if (!r.alive) continue;

      const dx = p.x - r.x;
      const dy = p.y - r.y;
      const d = Math.hypot(dx, dy) || 1;

      // elastic expansion: fast launch, asymptotic settle
      const front = rippleRadius * (1 - Math.exp(-rippleSpeed * r.age));
      // gaussian band around the wavefront
      const bandW = 26 + r.age * 30;
      const g = Math.exp(-((d - front) * (d - front)) / (2 * bandW * bandW));
      if (g < 0.01) continue;

      // damped oscillation → overshoot then ease back (wave interference)
      const osc = Math.sin(d * 0.11 - r.age * rippleSpeed * 2.4);
      const damping = Math.exp(-r.age * 1.9);
      const f = g * osc * damping * rippleStrength * r.strength;

      const nx = dx / d;
      const ny = dy / d;
      // radial push + gentle tangential shear (bends the trail)
      p.vx += (nx * f + -ny * f * 0.22) * dt;
      p.vy += (ny * f + nx * f * 0.22) * dt;

      // secondary, quieter echo a quarter-second behind
      if (r.age > 0.25) {
        const age2 = r.age - 0.25;
        const front2 = rippleRadius * 0.7 * (1 - Math.exp(-rippleSpeed * age2));
        const g2 = Math.exp(-((d - front2) * (d - front2)) / (2 * bandW * bandW));
        if (g2 > 0.01) {
          const f2 =
            g2 *
            Math.sin(d * 0.13 - age2 * rippleSpeed * 2.4) *
            Math.exp(-age2 * 2.2) *
            rippleStrength *
            r.strength *
            0.4;
          p.vx += nx * f2 * dt;
          p.vy += ny * f2 * dt;
        }
      }
    }
  }
}
