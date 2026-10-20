/**
 * The detonation engine — pure logic, no DOM.
 *
 * One effect system for every impact on the site. The canvas component draws
 * whatever this module decides; deciding lives here so it can be tested:
 *
 *   · intensity tiers: small (links), full (CTAs, tamper), max (hero signature)
 *   · a cooldown: two full/max impacts within MOTION.impactCooldown downgrade
 *     the second to `small`, so mashing a button cannot strobe the screen
 *   · flash budget: at most 3 flashes in any rolling second (WCAG 2.3.1)
 *   · reduced motion: no particles, no shake — one brief inversion instead
 *   · low power: particle count capped at 24
 *
 * Particles are square "pixels" on an integer grid, pooled and reused.
 */

import { MOTION } from "./motion";

export type Intensity = "small" | "full" | "max";

export interface ImpactPlan {
  readonly intensity: Intensity;
  readonly particles: number;
  /** Pixel size of each debris square. */
  readonly pixel: number;
  readonly ring: boolean;
  readonly flash: boolean;
  /** Shake amplitude in CSS px; 0 disables. */
  readonly shake: number;
  /** Reduced-motion substitute: invert the target briefly, nothing else. */
  readonly inversionOnly: boolean;
}

const TIERS: Record<Intensity, Omit<ImpactPlan, "intensity" | "inversionOnly">> = {
  small: { particles: 10, pixel: 3, ring: false, flash: false, shake: 0 },
  full: { particles: 36, pixel: 4, ring: true, flash: true, shake: 2 },
  max: { particles: 64, pixel: 5, ring: true, flash: true, shake: 3 },
};

export const LOW_POWER_PARTICLE_CAP = 24;
export const MAX_FLASHES_PER_SECOND = 3;

export interface PlannerOptions {
  readonly reduced: boolean;
  readonly lowPower: boolean;
}

export class ImpactPlanner {
  private lastHeavy = -Infinity;
  private flashes: number[] = [];

  constructor(private readonly opts: PlannerOptions) {}

  plan(requested: Intensity, now: number): ImpactPlan {
    if (this.opts.reduced) {
      return {
        intensity: "small",
        particles: 0,
        pixel: 0,
        ring: false,
        flash: false,
        shake: 0,
        inversionOnly: true,
      };
    }

    let intensity = requested;
    if (intensity !== "small") {
      if (now - this.lastHeavy < MOTION.impactCooldown) intensity = "small";
      else this.lastHeavy = now;
    }

    const tier = TIERS[intensity];
    this.flashes = this.flashes.filter((t) => now - t < 1000);
    const flash = tier.flash && this.flashes.length < MAX_FLASHES_PER_SECOND;
    if (flash) this.flashes.push(now);

    return {
      intensity,
      particles: this.opts.lowPower ? Math.min(tier.particles, LOW_POWER_PARTICLE_CAP) : tier.particles,
      pixel: tier.pixel,
      ring: tier.ring,
      flash,
      shake: this.opts.lowPower ? 0 : tier.shake,
      inversionOnly: false,
    };
  }
}

/* ── particle pool ─────────────────────────────────────────────────────── */

export interface Particle {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  ttl: number;
}

export class ParticlePool {
  readonly items: Particle[];

  constructor(capacity: number) {
    this.items = Array.from({ length: capacity }, () => ({
      alive: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 0,
      life: 0,
      ttl: 0,
    }));
  }

  /** Emit up to `count` particles; reuses dead slots, never allocates. */
  emit(count: number, x: number, y: number, pixel: number, rand: () => number = Math.random): number {
    let emitted = 0;
    for (const p of this.items) {
      if (emitted >= count) break;
      if (p.alive) continue;
      const angle = rand() * Math.PI * 2;
      const speed = 1.5 + rand() * 5;
      p.alive = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 1.5;
      p.size = pixel * (1 + Math.floor(rand() * 2));
      p.life = 0;
      p.ttl = 24 + Math.floor(rand() * 22);
      emitted++;
    }
    return emitted;
  }

  /** Advance one frame. Returns the number still alive. */
  step(): number {
    let alive = 0;
    for (const p of this.items) {
      if (!p.alive) continue;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22;
      p.vx *= 0.96;
      p.life++;
      if (p.life >= p.ttl) p.alive = false;
      else alive++;
    }
    return alive;
  }
}
