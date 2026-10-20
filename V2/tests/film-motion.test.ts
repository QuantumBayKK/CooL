/**
 * Detonation rate limit, flash budget and reduced-motion behaviour.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  ImpactPlanner,
  LOW_POWER_PARTICLE_CAP,
  MAX_FLASHES_PER_SECOND,
  ParticlePool,
} from "../src/lib/film/detonation";
import { MOTION } from "../src/lib/film/motion";
import { profileFrom } from "../src/lib/film/reducedMotion";

const normal = { reduced: false, lowPower: false };

test("a second full impact inside the cooldown downgrades to small", () => {
  const p = new ImpactPlanner(normal);
  assert.equal(p.plan("full", 0).intensity, "full");
  assert.equal(p.plan("full", MOTION.impactCooldown - 1).intensity, "small");
  assert.equal(p.plan("max", MOTION.impactCooldown + 10).intensity, "max");
});

test("never more than three flashes in any rolling second", () => {
  const p = new ImpactPlanner(normal);
  let flashes = 0;
  // A full impact every 410ms just clears the cooldown; over 1s that is at
  // most 3, and the budget also holds if the cooldown were ever shortened.
  for (let t = 0; t < 1000; t += 10) if (p.plan("full", t).flash) flashes++;
  assert.ok(flashes <= MAX_FLASHES_PER_SECOND, `flashes: ${flashes}`);
});

test("reduced motion: no particles, no shake, no flash — inversion only", () => {
  const p = new ImpactPlanner({ reduced: true, lowPower: false });
  const plan = p.plan("max", 0);
  assert.equal(plan.particles, 0);
  assert.equal(plan.shake, 0);
  assert.equal(plan.flash, false);
  assert.equal(plan.inversionOnly, true);
});

test("low power caps particles and disables shake", () => {
  const plan = new ImpactPlanner({ reduced: false, lowPower: true }).plan("max", 0);
  assert.ok(plan.particles <= LOW_POWER_PARTICLE_CAP);
  assert.equal(plan.shake, 0);
});

test("particle pool reuses slots and never exceeds capacity", () => {
  const pool = new ParticlePool(8);
  assert.equal(pool.emit(20, 0, 0, 4, () => 0.5), 8);
  assert.equal(pool.emit(5, 0, 0, 4, () => 0.5), 0);
  for (let i = 0; i < 100; i++) pool.step();
  assert.equal(pool.items.filter((x) => x.alive).length, 0);
  assert.equal(pool.emit(3, 0, 0, 4, () => 0.5), 3);
});

test("motion profile honours reduced motion, low cores and Save-Data", () => {
  const m = (set: string[]) => (q: string) => set.includes(q);
  assert.equal(profileFrom(m(["(prefers-reduced-motion: reduce)"]), {}).reduced, true);
  assert.equal(profileFrom(m([]), { hardwareConcurrency: 4 }).lowPower, true);
  assert.equal(profileFrom(m([]), { hardwareConcurrency: 16, connection: { saveData: true } }).lowPower, true);
  assert.equal(profileFrom(m([]), { hardwareConcurrency: 16 }).lowPower, false);
  assert.equal(profileFrom(m(["(pointer: fine)", "(hover: hover)"]), {}).finePointer, true);
  assert.equal(profileFrom(m(["(pointer: fine)"]), {}).finePointer, false);
});
