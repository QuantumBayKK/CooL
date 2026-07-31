"use client";

import { createContext, useContext, type ReactNode } from "react";
import clsx from "clsx";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * Book primitives: prose that surfaces out of the dark, one line at a time.
 *
 * The deck used to build every slide out of frosted cards. Cards fragment a
 * page into regions, and the reader has to decide where to start; on a slide
 * that is making an argument rather than listing features, that decision costs
 * more than the panel is worth. So there are no boxes here — only type,
 * hairlines and space.
 *
 * "From dark" is literal. Each line begins near-black, blurred and slightly
 * low, and resolves into full contrast as it lands. Staggered down the page it
 * reads as text surfacing rather than a list appearing, which is what makes a
 * long argument feel like it is being told rather than displayed.
 *
 * Everything animates opacity, blur and transform only — all compositor
 * properties — and the whole system collapses to plain static text under
 * `prefers-reduced-motion`.
 */

const FLUID = [0.16, 1, 0.3, 1] as const;

const Animated = createContext(true);

const page: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
};

const line: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(14px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.05, ease: FLUID },
  },
};

const still: Variants = { hidden: {}, show: {} };

/**
 * One page of the book. Wrap a slide's prose in this; every {@link Line},
 * {@link Body} and {@link Figures} inside it reveals in sequence.
 */
export function Page({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <Animated.Provider value={!reduced}>
      <motion.div
        variants={reduced ? still : page}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className={className}
      >
        {children}
      </motion.div>
    </Animated.Provider>
  );
}

/** A single revealed element. The building block everything else composes. */
export function Line({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const animated = useContext(Animated);
  return (
    <motion.div variants={animated ? line : still} className={className}>
      {children}
    </motion.div>
  );
}

/** The opening sentence of a page — larger, brighter, sets the argument. */
export function Lead({ children }: { children: ReactNode }) {
  return (
    <Line>
      <p className="max-w-[54ch] text-[17px] leading-[1.65] font-medium text-ink sm:text-[19px]">
        {children}
      </p>
    </Line>
  );
}

/** A paragraph of the story. Measure is capped so it stays readable. */
export function Body({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Line>
      <p
        className={clsx(
          "mt-5 max-w-[62ch] text-[15px] leading-[1.75] text-fog sm:text-[16.5px]",
          className,
        )}
      >
        {children}
      </p>
    </Line>
  );
}

/** A quieter aside — attribution, caveat, source. */
export function Aside({ children }: { children: ReactNode }) {
  return (
    <Line>
      <p className="mt-5 max-w-[58ch] text-[13.5px] leading-[1.7] text-mist sm:text-[14px]">
        {children}
      </p>
    </Line>
  );
}

/** Emphasis inside prose. No highlighter block — brightness does the work. */
export function Beat({
  children,
  tone = "ink",
}: {
  children: ReactNode;
  tone?: "ink" | "live" | "fail" | "verify";
}) {
  const color = {
    ink: "text-ink",
    live: "text-live",
    fail: "text-fail",
    verify: "text-verify",
  }[tone];
  return <span className={clsx("font-semibold", color)}>{children}</span>;
}

/**
 * A numbered or ticked sequence, set as indented prose rather than rows.
 * Hairline on the left instead of a border box: it groups the list without
 * drawing a container around it.
 */
export function Steps({
  items,
  lead = "count",
  tone = "fail",
}: {
  items: readonly (readonly [string, string])[];
  lead?: "count" | "tick";
  tone?: "fail" | "live" | "verify";
}) {
  const color = { fail: "text-fail", live: "text-live", verify: "text-verify" }[tone];
  const rule = {
    fail: "border-fail/25",
    live: "border-live/30",
    verify: "border-verify/30",
  }[tone];

  return (
    <div className={clsx("mt-6 max-w-[62ch] border-l pl-5 sm:pl-6", rule)}>
      {items.map(([term, rest], i) => (
        <Line key={term}>
          <p
            className={clsx(
              "text-[15px] leading-[1.6] text-fog sm:text-[16px]",
              i > 0 && "mt-3",
            )}
          >
            <span className={clsx("mr-2.5 font-mono text-[12px]", color)}>
              {lead === "tick" ? "✓" : String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-semibold text-ink">{term}</span>
            <span className="text-mist"> — {rest}</span>
          </p>
        </Line>
      ))}
    </div>
  );
}

/**
 * The numbers, set as type rather than tiles.
 *
 * This is where the argument has to land: hours, money, effort. Big figures on
 * a bare page carry more than the same figures inside three bordered cards,
 * because nothing competes with them for the eye.
 */
export function Figures({
  items,
  tone = "live",
}: {
  items: readonly (readonly [string, string])[];
  tone?: "live" | "fail" | "verify";
}) {
  const color = { live: "text-live", fail: "text-fail", verify: "text-verify" }[tone];
  return (
    <div className="mt-8 flex flex-wrap gap-x-12 gap-y-6">
      {items.map(([big, small]) => (
        <Line key={small}>
          <div className="max-w-[26ch]">
            <p className={clsx("display text-[clamp(1.7rem,5vw,2.5rem)] leading-none", color)}>
              {big}
            </p>
            <p className="mt-2 text-[13.5px] leading-snug text-mist sm:text-[14px]">
              {small}
            </p>
          </div>
        </Line>
      ))}
    </div>
  );
}

/** A row of plain labels — tools, integrations. No chips, no borders. */
export function Names({ items }: { items: readonly string[] }) {
  return (
    <Line>
      <p className="mt-5 max-w-[62ch] font-mono text-[12.5px] leading-[2] text-mist">
        {items.join("   ·   ")}
      </p>
    </Line>
  );
}
