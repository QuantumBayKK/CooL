"use client";

import { gsap } from "./gsap";
import { DURATION, EASE, STAGGER } from "@/config/motion.tokens";

/**
 * The motion lexicon (CDS §4.1) as reusable factories. Every meaningful motion in
 * the experience comes from here so easing/duration are never hand-rolled and each
 * motion carries one nameable meaning.
 *
 * Each factory returns a GSAP tween/timeline; callers control targets & placement.
 */

type Target = gsap.TweenTarget;

/** `reveal` — a thought/line arriving: soft fade + rise. Never slide-flash. */
export function reveal(target: Target, vars: gsap.TweenVars = {}): gsap.core.Tween {
  return gsap.fromTo(
    target,
    { autoAlpha: 0, y: 24 },
    {
      autoAlpha: 1,
      y: 0,
      duration: DURATION.cinematic,
      ease: EASE.cinematic,
      ...vars,
    },
  );
}

/** `recede` — exit / make way: gentle fade + slight depth push-back. */
export function recede(target: Target, vars: gsap.TweenVars = {}): gsap.core.Tween {
  return gsap.to(target, {
    autoAlpha: 0,
    y: -16,
    duration: DURATION.slow,
    ease: EASE.mass,
    ...vars,
  });
}

/** `assemble` — pieces converging into coherence/proof (staggered). */
export function assemble(target: Target, vars: gsap.TweenVars = {}): gsap.core.Tween {
  return gsap.fromTo(
    target,
    { autoAlpha: 0, scale: 0.96, filter: "blur(6px)" },
    {
      autoAlpha: 1,
      scale: 1,
      filter: "blur(0px)",
      duration: DURATION.cinematic,
      ease: EASE.cinematic,
      stagger: STAGGER.reveal,
      ...vars,
    },
  );
}

/** `verifyPulse` — the recurring verification heartbeat / confirmation bloom. */
export function verifyPulse(target: Target, vars: gsap.TweenVars = {}): gsap.core.Tween {
  return gsap.fromTo(
    target,
    { scale: 1, opacity: 0.85 },
    {
      scale: 1.04,
      opacity: 1,
      duration: DURATION.slow,
      ease: EASE.hold,
      yoyo: true,
      repeat: -1,
      ...vars,
    },
  );
}

/** `seal` — sealing / locking-in: smooth, continuous, final. */
export function seal(target: Target, vars: gsap.TweenVars = {}): gsap.core.Tween {
  return gsap.fromTo(
    target,
    { scale: 1.08, autoAlpha: 0 },
    {
      scale: 1,
      autoAlpha: 1,
      duration: DURATION.monumental,
      ease: EASE.mass,
      ...vars,
    },
  );
}
