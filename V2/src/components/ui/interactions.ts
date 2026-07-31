"use client";

import { useCallback, useEffect, useRef } from "react";
import { animate, utils } from "animejs";
import { prefersReduced } from "@/lib/motion";

/**
 * usePress — anime.js hover / press feedback for any control.
 *
 * Every tween targets `transform` only, so the browser can keep the button on
 * its own compositor layer and never re-layout the page. Spread `handlers` on
 * the element and attach `ref`.
 */
export function usePress<T extends HTMLElement = HTMLButtonElement>({
  lift = -2,
  hoverScale = 1.02,
  pressScale = 0.97,
} = {}) {
  const ref = useRef<T>(null);

  const to = useCallback(
    (scale: number, y: number, duration: number) => {
      const el = ref.current;
      if (!el || prefersReduced()) return;
      animate(el, { scale, translateY: y, duration, ease: "outExpo" });
    },
    [],
  );

  const handlers = {
    onPointerEnter: () => to(hoverScale, lift, 280),
    onPointerLeave: () => to(1, 0, 340),
    onPointerDown: () => to(pressScale, 0, 110),
    onPointerUp: () => to(hoverScale, lift, 220),
  };

  return { ref, handlers };
}

/**
 * useMagnetic — the element leans toward the cursor, then springs home.
 *
 * Desktop only: on a touch screen there is no hover, and running this on a
 * phone would just cost battery. The listener sits on the element (not the
 * window), so cost is zero until the pointer is actually over it.
 */
export function useMagnetic<T extends HTMLElement = HTMLDivElement>(
  /** peak travel in px when the cursor sits at the element's edge */
  strength = 14,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReduced()) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      // normalised by size, so a wide button and a small icon lean equally
      const dx = ((e.clientX - (r.left + r.width / 2)) / r.width) * strength * 2;
      const dy = ((e.clientY - (r.top + r.height / 2)) / r.height) * strength * 2;
      animate(el, {
        translateX: dx,
        translateY: dy,
        duration: 420,
        ease: "outExpo",
      });
    };

    const leave = () => {
      animate(el, {
        translateX: 0,
        translateY: 0,
        duration: 700,
        ease: "outElastic(1, 0.5)",
      });
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      utils.remove(el);
    };
  }, [strength]);

  return ref;
}

/**
 * useSpotlight — writes the pointer position into CSS custom properties so a
 * radial-gradient highlight can track the cursor.
 *
 * Deliberately not an animation: setting two custom properties on pointermove
 * is far cheaper than tweening, and the gradient follows the finger exactly.
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let queued = false;
    let px = 0;
    let py = 0;

    const flush = () => {
      queued = false;
      el.style.setProperty("--spot-x", `${px}%`);
      el.style.setProperty("--spot-y", `${py}%`);
    };

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width) * 100;
      py = ((e.clientY - r.top) / r.height) * 100;
      // coalesce to one write per frame
      if (!queued) {
        queued = true;
        requestAnimationFrame(flush);
      }
    };

    const enter = () => el.style.setProperty("--spot-opacity", "1");
    const leave = () => el.style.setProperty("--spot-opacity", "0");

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return ref;
}
