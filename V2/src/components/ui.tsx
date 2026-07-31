"use client";

import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import type { ReactNode } from "react";

/* Reveal — fluid: unblur + settle. One easing across the whole site.
   No clipPath here: a persisted clip crops box-shadows (button glows) at the
   element's edge. */
export const FLUID: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={
        reduced
          ? false
          : {
              opacity: 0,
              y: 30,
              filter: "blur(10px)",
            }
      }
      whileInView={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
      }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, delay, ease: FLUID }}
    >
      {children}
    </motion.div>
  );
}

export type Tone = "verify" | "live" | "mock" | "fail" | "mist";

/* tones set colour only — the dark frosted backing comes from the base class
   below so chips stay legible over the cipher field */
const toneText: Record<Tone, string> = {
  verify: "text-verify border-verify/40",
  live: "text-live border-live/40",
  mock: "text-mock border-mock/40",
  fail: "text-fail border-fail/40",
  mist: "text-fog border-line",
};

/* MonoTag — small mono chip for statuses. */
export function MonoTag({
  children,
  tone = "mist",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "frost inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium tracking-[0.14em] uppercase",
        toneText[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* Kicker — cinematic poster type. No chip, no box: just letterspaced light. */
export function Kicker({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={clsx("kicker block text-[15px] sm:text-base", className)}>
      {children}
    </span>
  );
}

/* Station — one scroll section. Phone-first: narrow column, generous padding. */
export function Station({
  id,
  layer,
  station,
  title,
  sub,
  children,
  wide = false,
}: {
  id: string;
  layer?: "01 · THE MOVIE" | "02 · THE ENGINEER" | "03 · DUE DILIGENCE";
  station: string;
  title: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  wide?: boolean;
}) {
  return (
    <section
      id={id}
      data-layer={layer}
      className={clsx(
        "relative mx-auto w-full scroll-mt-20 px-5 py-20 sm:py-28",
        wide ? "max-w-5xl" : "max-w-xl md:max-w-2xl",
      )}
    >
      <Reveal>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <MonoTag>{station}</MonoTag>
          {layer ? <MonoTag className="opacity-70">{layer}</MonoTag> : null}
        </div>
        <div className="overflow-hidden">
          <motion.h2
            className="display text-[clamp(2rem,8.5vw,3.6rem)]"
            initial={{ y: "108%", skewY: 2.5 }}
            whileInView={{ y: "0%", skewY: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1, ease: FLUID }}
          >
            {title}
          </motion.h2>
        </div>
        {sub ? (
          <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-mist sm:text-base">
            {sub}
          </p>
        ) : null}
      </Reveal>
      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  );
}

/**
 * Mark — the phrase a skimmer must not miss.
 *
 * An investor scrolls a deck faster than they read it, so each slide needs one
 * or two anchors the eye lands on regardless. This is a tinted underlay rather
 * than a highlighter block: at these type sizes a solid fill fights the text,
 * whereas a low-opacity wash plus a brighter ink reads as emphasis and stays
 * legible on the dark canvas.
 *
 * Use it sparingly. Two marks on a slide is emphasis; five is wallpaper.
 */
export function Mark({
  children,
  tone = "verify",
}: {
  children: ReactNode;
  tone?: "verify" | "live" | "fail";
}) {
  const styles = {
    verify: "bg-verify/[0.16] text-ink decoration-verify/50",
    live: "bg-live/[0.15] text-ink decoration-live/50",
    fail: "bg-fail/[0.14] text-ink decoration-fail/50",
  }[tone];
  return (
    <span
      className={clsx(
        "rounded-[3px] px-[0.25em] py-[0.06em] font-semibold underline decoration-[1.5px] underline-offset-[3px]",
        styles,
      )}
    >
      {children}
    </span>
  );
}

/* GitHub mark — lucide dropped brand glyphs in v1, and the repos are the most
   load-bearing links on the deck, so they get the real mark rather than a
   generic "external link" arrow. */
export function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

/* Glass card */
export function Glass({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={clsx("glass rounded-2xl", onClick && "cursor-pointer", className)}
    >
      {children}
    </div>
  );
}
