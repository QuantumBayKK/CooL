"use client";

import Lenis from "lenis";
import { type ReactNode, useEffect } from "react";
import { gsap, registerGsap, ScrollTrigger } from "@/engines/animation/gsap";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
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

    if (reduced) {
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(max > 0 ? window.scrollY / max : 0);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }

    const lenis = new Lenis({
      // lerp gives a consistent, responsive follow (the duration+easing mode reads
      // as floaty/laggy and inconsistent across input devices).
      lerp: 0.11,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });

    const onLenisScroll = () => {
      ScrollTrigger.update();
      setScrollProgress(lenis.progress ?? 0);
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
