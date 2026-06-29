"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Reduced-motion as a first-class signal (Story Bible Rule 12). Chapters branch
 * on this to render a dignified still/cross-fade variant that keeps the meaning.
 */
export function usePrefersReducedMotion(): boolean {
  // Default to `true` (the safe, still path) until we confirm on the client.
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    setReduced(mql.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
