"use client";

import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { animate, stagger } from "animejs";
import clsx from "clsx";
import { FLUID, isPhone, prefersReduced } from "@/lib/motion";

/**
 * Reveal — the site's one entrance animation, driven by anime.js.
 *
 * IntersectionObserver fires the trigger (cheapest possible, browser-native)
 * and anime.js does the animating. One-shot by default: once a block has
 * arrived it is never animated again, so scrolling past old content costs
 * nothing. That is what keeps long pages smooth on a phone.
 *
 * `stagger` reveals the element's direct children in sequence instead of the
 * wrapper as a whole — use it for card grids and lists.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  blur = 8,
  stagger: step,
  margin = "-12% 0px -8% 0px",
  duration = 900,
}: {
  children: ReactNode;
  className?: string;
  /** ms before the animation starts */
  delay?: number;
  /** px travelled upward into place */
  y?: number;
  /** px of blur burned off as it lands */
  blur?: number;
  /** ms between children — omit to animate the wrapper as one block */
  stagger?: number;
  /** IntersectionObserver rootMargin */
  margin?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;

    const targets: HTMLElement[] =
      step != null
        ? (Array.from(host.children) as HTMLElement[])
        : [host as HTMLElement];

    const land = () => {
      for (const t of targets) {
        t.style.opacity = "1";
        t.style.filter = "none";
        t.style.transform = "none";
      }
      host.style.opacity = "1";
      host.style.filter = "none";
    };

    // reduced motion: no travel, no blur — just be there
    if (prefersReduced()) {
      land();
      return;
    }

    // in stagger mode the children carry the hidden state, not the wrapper
    if (step != null) {
      for (const t of targets) {
        t.style.opacity = "0";
        t.style.willChange = "transform, opacity, filter";
      }
      host.style.opacity = "1";
      host.style.filter = "none";
    }

    // Animated blur is by far the most expensive property here — a staggered
    // grid of them is what makes a mid-range phone drop frames. Phones get the
    // travel and the fade, and skip the blur entirely; the difference is barely
    // perceptible and it costs nothing.
    const blurPx = isPhone() ? 0 : blur;

    let played = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || played) continue;
          played = true;
          io.disconnect();
          animate(targets, {
            opacity: [0, 1],
            translateY: [y, 0],
            ...(blurPx > 0
              ? { filter: [`blur(${blurPx}px)`, "blur(0px)"] }
              : {}),
            duration,
            ease: FLUID,
            delay: step != null ? stagger(step, { start: delay }) : delay,
            onComplete: () => {
              // drop the compositor hint and the filter so the finished
              // element settles back into a plain, cheap layer
              for (const t of targets) {
                t.style.willChange = "auto";
                t.style.filter = "none";
              }
            },
          });
        }
      },
      { rootMargin: margin, threshold: 0.01 },
    );
    io.observe(host);
    return () => io.disconnect();
  }, [delay, y, blur, step, margin, duration]);

  return (
    <div
      ref={ref}
      data-reveal
      className={clsx(className)}
      style={{ opacity: 0, willChange: "transform, opacity, filter" }}
    >
      {children}
    </div>
  );
}

/**
 * SplitReveal — headline type that rises word by word out of a clipped line.
 * Each word gets its own overflow-hidden wrapper, and the space between words
 * sits outside those wrappers (inside, it would be collapsed and the words
 * would run together).
 */
export function SplitReveal({
  text,
  className,
  delay = 0,
  step = 55,
  margin = "-10% 0px -10% 0px",
}: {
  text: string;
  className?: string;
  delay?: number;
  step?: number;
  margin?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const inner = Array.from(host.querySelectorAll<HTMLElement>("[data-word]"));
    if (!inner.length) return;

    if (prefersReduced()) {
      for (const w of inner) w.style.transform = "none";
      host.style.opacity = "1";
      return;
    }

    let played = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || played) continue;
          played = true;
          io.disconnect();
          host.style.opacity = "1";
          animate(inner, {
            translateY: ["110%", "0%"],
            duration: 1050,
            ease: FLUID,
            delay: stagger(step, { start: delay }),
            onComplete: () => {
              for (const w of inner) w.style.willChange = "auto";
            },
          });
        }
      },
      { rootMargin: margin, threshold: 0.01 },
    );
    io.observe(host);
    return () => io.disconnect();
  }, [delay, step, margin]);

  return (
    <span ref={ref} className={clsx("block", className)} style={{ opacity: 0 }}>
      {words.map((w, i) => (
        <Fragment key={`${w}-${i}`}>
          <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <span
              data-word
              className="inline-block"
              style={{ transform: "translateY(110%)", willChange: "transform" }}
            >
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
