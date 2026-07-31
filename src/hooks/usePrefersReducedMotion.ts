"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Reduced-motion as a first-class signal (Story Bible Rule 12). Chapters branch
 * on this to render a dignified still/cross-fade variant that keeps the meaning.
 */
export function usePrefersReducedMotion(): boolean {
  // Read the media query synchronously on the client so pinned timelines and Lenis
  // build once in the right mode (no build → revert → rebuild churn on mount).
  // SSR has no matchMedia; the effect below reconciles after hydration.
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia(QUERY).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    setReduced(mql.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
