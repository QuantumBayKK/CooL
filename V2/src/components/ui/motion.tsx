"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The site's entire motion vocabulary.
 *
 * The brief is "extremely subtle — opacity, small translate, small scale; no
 * bouncing, no spinning". Rather than trusting that to reviewer discipline,
 * this module is the only place animation is allowed to be defined, and the
 * constants below are the ceiling:
 *
 *   · translate ≤ 8px
 *   · scale     ≥ 0.99  (never below — a card that shrinks 5% reads as a toy)
 *   · duration  ≤ 240ms
 *   · easing    monotonic, so nothing can overshoot and come back
 *
 * There is no spring anywhere in this file. A spring's defining feature is
 * overshoot, and overshoot is exactly what makes an interface feel consumer.
 *
 * Every component honours `prefers-reduced-motion` by rendering the final state
 * immediately — not by shortening the animation. The setting is a request for
 * no motion, not for fast motion.
 */

const DISTANCE = 8;
const DURATION = 0.24;
const EASE = [0.22, 0.61, 0.36, 1] as const;

/* ── Reveal ───────────────────────────────────────────────────────────────── */

/**
 * Fade + 8px rise, once, when the element first enters the viewport.
 *
 * `once: true` matters: an element that re-animates every time it scrolls back
 * into view turns a long page into a slot machine. `margin` fires it slightly
 * before the edge so the element is already settled by the time it is properly
 * readable.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const reduced = useReducedMotion();
  const Comp = motion[as];

  if (reduced) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: DISTANCE }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: DURATION, ease: EASE, delay }}
    >
      {children}
    </Comp>
  );
}

/* ── Stagger ──────────────────────────────────────────────────────────────── */

/**
 * A list whose children arrive in sequence.
 *
 * 45ms between children. Fast enough to read as one gesture rather than as a
 * queue; the whole group is settled inside ~400ms for a six-item list. Anything
 * slower and the reader is waiting for the interface.
 *
 * `cap` stops a long list from producing an absurd tail — item 40 must not
 * animate two seconds after item 1, so past the cap everything arrives together.
 */
export function Stagger({
  children,
  className,
  step = 0.045,
  cap = 8,
  as = "div",
}: {
  children: ReactNode[];
  className?: string;
  step?: number;
  cap?: number;
  as?: "div" | "ul" | "ol";
}) {
  const reduced = useReducedMotion();
  const Static = as;

  if (reduced) return <Static className={className}>{children}</Static>;

  const Comp = motion[as];
  return (
    <Comp className={className} initial="hidden" whileInView="shown" viewport={{ once: true, margin: "0px 0px -10% 0px" }}>
      {children.map((child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: DISTANCE },
            shown: {
              opacity: 1,
              y: 0,
              transition: {
                duration: DURATION,
                ease: EASE,
                delay: Math.min(i, cap) * step,
              },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </Comp>
  );
}

/* ── PageTransition ───────────────────────────────────────────────────────── */

/**
 * Route change: opacity only.
 *
 * No translate here, deliberately. A page-level slide fights the browser's own
 * scroll restoration and makes back-navigation feel wrong, and at full-page
 * scale even 8px of movement is visible as a jolt. 160ms — short enough that it
 * never delays reading, long enough to mask the swap.
 */
export function PageTransition({
  children,
  routeKey,
}: {
  children: ReactNode;
  routeKey: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Collapse ─────────────────────────────────────────────────────────────── */

/**
 * Height + opacity, for disclosure rows.
 *
 * `height: auto` is animatable in Motion and the measurement is handled for us;
 * doing it by hand with max-height produces either a clipped panel or a lazy
 * tail, depending on which guess you make about the content height.
 */
export function Collapse({
  open,
  children,
  className,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          className={cn("overflow-hidden", className)}
          initial={reduced ? false : { height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.19, ease: EASE }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
