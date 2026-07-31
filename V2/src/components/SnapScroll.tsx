"use client";

import { useEffect } from "react";
import { prefersReduced, scrollToY } from "@/lib/motion";

/**
 * SnapScroll — makes the deck advance exactly one slide per scroll gesture.
 *
 * Two mechanisms, and only ever one of them active at a time:
 *
 *   Touch / trackpad-less devices — native CSS scroll-snap (see globals.css).
 *     `mandatory` + `scroll-snap-stop: always` gives a hard, decisive snap that
 *     the compositor drives, so momentum and rubber-banding stay perfect and
 *     the main thread does nothing at all.
 *
 *   Mouse wheel — this controller. A wheel notch is a discrete intent, so it
 *     maps to exactly one slide: we swallow the event, scroll to the next
 *     slide's top, and stay locked until the scroll settles. `.snap-js` turns
 *     CSS snap off while this is in charge.
 *
 * The one thing that made mandatory snapping unusable before was slides taller
 * than the viewport — snap would fight you as you tried to read them. So every
 * slide is measured and the tall ones get `.is-tall`, which drops their snap
 * point; the wheel path likewise scrolls through a tall slide normally and only
 * snaps once you reach its edge.
 */
export default function SnapScroll() {
  useEffect(() => {
    if (prefersReduced()) return;

    const root = document.documentElement;
    let slides: HTMLElement[] = [];

    const collect = () => {
      slides = Array.from(document.querySelectorAll<HTMLElement>("[data-slide]"));
    };

    /* ---------- wheel deck: fine pointers only ---------- */
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");

    /** flag slides that don't fit, so CSS drops their snap point */
    const measure = () => {
      // Runs on every device now that snapping is on everywhere. A slide that
      // outgrows the viewport must lose its snap point on a phone just as much
      // as on a laptop — more so, since that is where it happens first.
      const vh = window.innerHeight;
      for (const s of slides) {
        s.classList.toggle("is-tall", s.offsetHeight > vh + 40);
      }
    };

    const clearTall = () => {
      for (const s of slides) s.classList.remove("is-tall");
    };

    const ro = new ResizeObserver(measure);
    const observeAll = () => {
      ro.disconnect();
      for (const s of slides) ro.observe(s);
    };

    /* Re-measure on resize, but only when the WIDTH actually changed.
       A mobile browser reports a resize every time the URL bar collapses or
       expands — height-only churn that would otherwise retoggle snap points
       in the middle of a scroll and make the page lurch. Width changes are
       real layout changes; height changes on their own are chrome. */
    let lastWidth = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      measure();
    };

    collect();
    measure();
    observeAll();
    window.addEventListener("resize", onResize, { passive: true });

    let locked = false;
    let lastSnap = 0;
    let detach: (() => void) | null = null;

    const isTall = (s: HTMLElement) => s.offsetHeight > window.innerHeight + 40;

    /** index of the slide that owns the current viewport top */
    const indexAtTop = () => {
      const y = window.scrollY + 12;
      for (let i = slides.length - 1; i >= 0; i--) {
        const s = slides[i];
        if (s && s.offsetTop <= y) return i;
      }
      return 0;
    };

    const go = async (idx: number) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, idx));
      const target = slides[clamped];
      if (!target) return;
      locked = true;
      lastSnap = performance.now();
      await scrollToY(target.offsetTop);
      locked = false;
    };

    const onWheel = (e: WheelEvent) => {
      // pinch-zoom and horizontal scrolls are not deck navigation
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (Math.abs(e.deltaY) < 4) return;

      const i = indexAtTop();
      const slide = slides[i];
      if (!slide) return;
      const dir: 1 | -1 = e.deltaY > 0 ? 1 : -1;

      // a tall slide is read by scrolling, not snapped through — hand the
      // gesture back to the browser until we're at the slide's edge
      if (isTall(slide)) {
        const slideBottom = slide.offsetTop + slide.offsetHeight;
        const viewBottom = window.scrollY + window.innerHeight;
        if (dir > 0 && viewBottom < slideBottom - 24) return;
        if (dir < 0 && window.scrollY > slide.offsetTop + 24) return;
      }

      // from here on this gesture belongs to the deck. Keep swallowing while
      // locked, or the page drifts underneath the animation.
      e.preventDefault();
      if (locked || performance.now() - lastSnap < 240) return;
      void go(i + dir);
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))
      ) {
        return;
      }
      if (e.key === "PageDown") {
        e.preventDefault();
        void go(indexAtTop() + 1);
      } else if (e.key === "PageUp") {
        e.preventDefault();
        void go(indexAtTop() - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        void go(0);
      } else if (e.key === "End") {
        e.preventDefault();
        void go(slides.length - 1);
      }
    };

    const attach = () => {
      if (detach) return;
      root.classList.add("snap-js");
      // passive:false — the whole point is that we get to preventDefault
      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("keydown", onKey);
      detach = () => {
        root.classList.remove("snap-js");
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("keydown", onKey);
        detach = null;
      };
    };

    const sync = () => {
      collect();
      measure();
      observeAll();
      // The wheel controller is still pointer-only: a touch device gets native
      // CSS snap, which the compositor drives with correct momentum for free.
      if (fine.matches) attach();
      else detach?.();
    };

    sync();
    fine.addEventListener("change", sync);

    return () => {
      fine.removeEventListener("change", sync);
      detach?.();
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      clearTall();
      root.classList.remove("snap-js");
    };
  }, []);

  return null;
}
