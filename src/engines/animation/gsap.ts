"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Animation Engine — single place that registers GSAP plugins (Technical Architecture §4.3).
 * Import { gsap, ScrollTrigger } from here, never directly, so registration is guaranteed once.
 */
let registered = false;

export function registerGsap(): void {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  // Cinematic smoothness: disable lag smoothing so scrubbed timelines track scroll exactly.
  gsap.ticker.lagSmoothing(0);
  registered = true;
}

export { gsap, ScrollTrigger };
