"use client";

import { useRef } from "react";
import { gsap, registerGsap, ScrollTrigger } from "@/engines/animation/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

export interface PinnedTimelineOptions {
  /** Pin duration as a multiple of viewport height. */
  scrollLength?: number;
  /** Build the scrubbed timeline. Selectors are scoped to the section root. */
  build: (tl: gsap.core.Timeline, root: HTMLElement) => void;
  /**
   * When false (reduced motion), the chapter renders statically — no pin, no scrub.
   * The `buildStatic` fallback reveals content with a dignified cross-fade.
   */
  enabled?: boolean;
  buildStatic?: (root: HTMLElement) => void;
  /** Per-frame normalized progress (0..1) for the pinned section. */
  onProgress?: (progress: number) => void;
  /** Fires when the section becomes the active chapter (both scroll directions). */
  onActivate?: () => void;
}

/**
 * Scene Engine core (Technical Architecture §4.2). Pins a section and builds a
 * scrub-driven GSAP timeline inside a `gsap.context` that is reverted on unmount —
 * deterministic across scroll direction, zero leaks, no cross-chapter conflicts.
 */
export function usePinnedTimeline<T extends HTMLElement>(
  options: PinnedTimelineOptions,
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const {
    scrollLength = 6,
    build,
    enabled = true,
    buildStatic,
    onProgress,
    onActivate,
  } = options;

  // Timeline is built once; it re-runs only when motion mode / scroll length change.
  // (build/onProgress are intentionally captured by closure and not in deps.)
  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    registerGsap();

    const ctx = gsap.context(() => {
      // Chapter activation — independent of pin so it works in both motion modes.
      if (onActivate) {
        ScrollTrigger.create({
          trigger: root,
          start: "top center",
          end: "bottom center",
          onEnter: onActivate,
          onEnterBack: onActivate,
        });
      }

      if (!enabled) {
        buildStatic?.(root);
        return;
      }
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${window.innerHeight * scrollLength}`,
          scrub: true,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => onProgress?.(self.progress),
        },
      });
      build(tl, root);
    }, root);

    return () => ctx.revert();
  }, [enabled, scrollLength]);

  return ref;
}
