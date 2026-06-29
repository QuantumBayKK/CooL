"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * The cursor as a flashlight (Story Bible §11 — "the cursor reveals"). A soft pool of
 * verifiable light follows the pointer, screen-blended over the dark. Skipped on touch
 * and under reduced motion. Pointer reads are rAF-throttled — no layout work per move.
 */
export function CursorLight() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = ref.current;
    if (!el) return;

    let x = -200;
    let y = -200;
    let raf = 0;

    const apply = () => {
      raf = 0;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      el.style.opacity = "1";
    };
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      el.style.opacity = "0";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-20 opacity-0 mix-blend-screen transition-opacity duration-700"
      style={{
        background:
          "radial-gradient(240px circle at var(--mx, -200px) var(--my, -200px), color-mix(in oklab, var(--color-verify) 9%, transparent), transparent 72%)",
      }}
    />
  );
}
