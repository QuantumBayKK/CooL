"use client";

import { useEffect } from "react";

/**
 * Scroll reveals for the essay. Enhancement only — the page is complete
 * without it, and this file is written so that it cannot make the page worse.
 *
 * THE CONSTRAINT THIS IS BUILT AROUND
 *
 * The public route is server-rendered with no client boundary: every word is in
 * the HTML that arrives, which is what a crawler indexes and what someone on a
 * flaky connection actually gets. A reveal layer is the classic way to destroy
 * that — `opacity: 0` in the stylesheet, JavaScript to undo it, and a page that
 * is blank for anyone whose JS never arrives.
 *
 * So: NO start state exists in CSS. Nothing on this page is hidden by the
 * stylesheet, ever. The start state is written by JavaScript at runtime, and
 * only onto elements that are off-screen at the moment it runs. If this file
 * fails to load, fails to parse, or never runs, the page is exactly the page it
 * was before — at full opacity, fully readable, fully scrollable.
 *
 * WHY ONLY OFF-SCREEN ELEMENTS
 *
 * GSAP is imported dynamically, so it arrives after first paint. Hiding
 * something the reader is already looking at, in order to fade it back in, is a
 * flash — the reader sees the cover, then loses it, then gets it back. Elements
 * already in the viewport when this runs are therefore left alone entirely.
 * They were never going to be "revealed"; they were already read.
 *
 * The consequence is deliberate: the cover has no entrance. That is the correct
 * trade. An entrance nobody asked for, played over content already on screen,
 * is worse than no entrance.
 *
 * MOTION SPEC, FIXED
 *
 *   450ms · power2.out (ease-out, no overshoot) · 60ms stagger · 16px rise
 *   opacity and transform only · once, never on scroll-back
 *
 * No `pin`, no `scrub`, no `snap`, and `normalizeScroll` is never called.
 * `pin` and `normalizeScroll` both take over the scroller, and this document
 * has exactly one scroll container by design — `html` — which is the invariant
 * a previous version of this site broke and spent a whole commit fixing. A
 * reveal effect is not worth risking it.
 *
 * The page at rest is identical to the page with motion disabled.
 *
 * THE FAILURE MODE THIS GUARDS
 *
 * A reveal layer's worst case is content stuck at `opacity: 0` because the
 * thing meant to reveal it never ran. Three defences, in order of how likely
 * they are to matter:
 *
 *   1. Only off-screen elements are ever hidden, so the first screen is never
 *      at risk however badly the rest goes wrong.
 *   2. Setup runs inside try/catch and reverts on any throw, which restores
 *      every element to the stylesheet's values — the page the server sent.
 *   3. `@media print` in globals.css forces opacity and transform back for the
 *      whole essay, so a printed or PDF'd page is never partly blank. That
 *      rule only ever reveals; it can never hide.
 */
export function Reveals() {
  useEffect(() => {
    // Honour the OS setting before anything is loaded. Under `reduce`, GSAP is
    // never even fetched — the cheapest implementation of "no motion" is no
    // code, and it keeps the network quiet for the readers who asked for calm.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      let gsap: typeof import("gsap").gsap;
      let ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
      try {
        [{ gsap }, { ScrollTrigger }] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
      } catch {
        // GSAP did not arrive. Nothing has been hidden yet, so there is
        // nothing to undo — the page simply stays as the server rendered it.
        return;
      }
      if (cancelled) return;

      let ctx: ReturnType<typeof gsap.context> | undefined;
      try {
        gsap.registerPlugin(ScrollTrigger);

        ctx = gsap.context(() => {
          const sections = document.querySelectorAll<HTMLElement>(".essay main section");

          sections.forEach((section) => {
            const wrap = section.querySelector<HTMLElement>(".wrap");
            if (!wrap) return;

            // Direct children only. Animating every descendant means a
            // paragraph fades while the words inside it fade separately, which
            // reads as a rendering fault rather than as an entrance.
            const targets = Array.from(wrap.children).filter(
              (el): el is HTMLElement =>
                el instanceof HTMLElement &&
                // Anything already on screen is left exactly as it is.
                el.getBoundingClientRect().top > window.innerHeight,
            );
            if (targets.length === 0) return;

            gsap.fromTo(
              targets,
              { opacity: 0, y: 16 },
              {
                opacity: 1,
                y: 0,
                duration: 0.45,
                ease: "power2.out",
                stagger: 0.06,
                // Hand the element back to the stylesheet once it has arrived,
                // so nothing is left carrying an inline transform for a later
                // layout to fight.
                clearProps: "opacity,transform",
                scrollTrigger: {
                  trigger: section,
                  start: "top 78%",
                  once: true,
                  // No pin. No scrub. No snap. No normalizeScroll.
                  // See the note above — the scroller is not ours to take.
                },
              },
            );
          });
        });
      } catch {
        ctx?.revert();
        return;
      }

      // If the reader turns reduced-motion on mid-visit, stop and restore
      // rather than leaving half-faded content behind.
      const settled = ctx;
      const onPrefChange = () => {
        if (reduce.matches) settled.revert();
      };
      reduce.addEventListener("change", onPrefChange);

      cleanup = () => {
        reduce.removeEventListener("change", onPrefChange);
        settled.revert();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
