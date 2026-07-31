"use client";

import Lenis from "lenis";
import { type ReactNode, useEffect } from "react";
import { gsap, registerGsap, ScrollTrigger } from "@/engines/animation/gsap";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { scrollSound } from "@/engines/audio/ScrollSound";
import { useExperienceStore } from "@/stores/experience.store";

/**
 * Wires Lenis smooth scroll to GSAP ScrollTrigger (Technical Architecture §6).
 * Lenis's RAF drives GSAP's ticker; every Lenis scroll updates ScrollTrigger and
 * the global scroll-progress slice. Under reduced-motion we fall back to native
 * scroll while still reporting progress, so the narrative stays intact.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  const setReducedMotion = useExperienceStore((s) => s.setReducedMotion);
  const setScrollProgress = useExperienceStore((s) => s.setScrollProgress);

  useEffect(() => {
    setReducedMotion(reduced);
  }, [reduced, setReducedMotion]);

  useEffect(() => {
    registerGsap();

    let lastProgress = 0;

    if (reduced) {
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        setScrollProgress(p);
        scrollSound.onScroll(p, Math.abs(p - lastProgress));
        lastProgress = p;
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }

    const lenis = new Lenis({
      // A slightly weightier follow than the default: smoother and more consistent
      // across wheel/trackpad/touch so the film never feels too fast or too slow.
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.25,
      // Route same-page anchor links (#architecture, #security…) through Lenis so
      // they glide instead of jumping and fighting the smoother.
      anchors: true,
    });

    const onLenisScroll = () => {
      ScrollTrigger.update();
      const p = lenis.progress ?? 0;
      setScrollProgress(p);
      // Feed the synthesized scroll cue with progress + per-event velocity.
      scrollSound.onScroll(p, Math.abs(p - lastProgress));
      lastProgress = p;
    };
    lenis.on("scroll", onLenisScroll);

    const ticker = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(ticker);

    return () => {
      gsap.ticker.remove(ticker);
      lenis.off("scroll", onLenisScroll);
      lenis.destroy();
    };
  }, [reduced, setScrollProgress]);

  return <>{children}</>;
}
