"use client";

/**
 * Long-form primitives for /why.
 *
 * The deck's `Book` set is built for one screen at a time: a lead, a few
 * paragraphs, a figure, done. This page is a different shape — it is a piece of
 * writing that happens to live on a website, and a reader should be able to
 * fall into it and come out the other end knowing why the product exists.
 *
 * So the rules here are a reader's rules, not a designer's. One column. A
 * measure that stays under about 66 characters, because past that the eye loses
 * the start of the next line. Chapters that announce themselves so the page can
 * be re-entered halfway down. Boxes used sparingly and only where something is
 * genuinely an interruption — a quoted voice, a caveat, a definition — because
 * a page that boxes everything has boxed nothing.
 *
 * Text surfaces as it arrives rather than appearing, which on a page this long
 * is the difference between reading and scanning. All of it collapses to static
 * text under `prefers-reduced-motion`.
 */
import { createContext, useContext, type ReactNode } from "react";
import clsx from "clsx";
import { motion, useReducedMotion, type Variants } from "framer-motion";

const FLUID = [0.16, 1, 0.3, 1] as const;
const Animated = createContext(true);

const group: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.02 } },
};

const line: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease: FLUID },
  },
};

const still: Variants = { hidden: {}, show: {} };

/** A run of prose that reveals in sequence as it comes into view. */
export function Reveal({
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
        variants={reduced ? still : group}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className={className}
      >
        {children}
      </motion.div>
    </Animated.Provider>
  );
}

function Item({ children, className }: { children: ReactNode; className?: string }) {
  const animated = useContext(Animated);
  return (
    <motion.div variants={animated ? line : still} className={className}>
      {children}
    </motion.div>
  );
}

/* ── structure ────────────────────────────────────────────────────────── */

/**
 * A chapter. The number is set quietly beside the title rather than above it,
 * so the page reads as continuous rather than as a stack of sections.
 */
export function Chapter({
  no,
  title,
  id,
  children,
}: {
  no: string;
  title: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line pt-14 sm:pt-20">
      <Reveal>
        <Item>
          <p className="font-mono text-[11.5px] tracking-[0.22em] text-verify uppercase">
            {no}
          </p>
        </Item>
        <Item>
          <h2 className="mt-3 max-w-[22ch] text-[clamp(1.6rem,4.6vw,2.5rem)] leading-[1.08] font-semibold tracking-[-0.03em] text-ink text-balance">
            {title}
          </h2>
        </Item>
      </Reveal>
      <div className="mt-7">{children}</div>
    </section>
  );
}

/** The opening sentence of a chapter — brighter and a size up. */
export function Lede({ children }: { children: ReactNode }) {
  return (
    <Reveal>
      <Item>
        <p className="max-w-[56ch] text-[17.5px] leading-[1.6] font-medium text-ink sm:text-[20px]">
          {children}
        </p>
      </Item>
    </Reveal>
  );
}

/** A paragraph. Grouped runs of these are what the page is mostly made of. */
export function P({ children }: { children: ReactNode }) {
  return (
    <Item>
      <p className="mt-5 max-w-[64ch] text-[15.5px] leading-[1.8] text-fog sm:text-[16.5px]">
        {children}
      </p>
    </Item>
  );
}

/** Several paragraphs that reveal together. */
export function Passage({ children }: { children: ReactNode }) {
  return <Reveal>{children}</Reveal>;
}

/** Emphasis inside prose. Brightness and weight, never a highlighter block. */
export function B({
  children,
  tone = "ink",
}: {
  children: ReactNode;
  tone?: "ink" | "live" | "fail" | "verify" | "warn";
}) {
  const color = {
    ink: "text-ink",
    live: "text-live",
    fail: "text-fail",
    verify: "text-verify",
    warn: "text-warn",
  }[tone];
  return <span className={clsx("font-semibold", color)}>{children}</span>;
}

/**
 * The line the chapter is really about, given its own air.
 *
 * Used about once per chapter at most. A pull quote that appears every third
 * paragraph stops being emphasis and becomes texture.
 */
export function Pull({
  children,
  tone = "ink",
}: {
  children: ReactNode;
  tone?: "ink" | "fail" | "live" | "verify" | "warn";
}) {
  const color = {
    ink: "text-ink",
    fail: "text-fail",
    live: "text-live",
    verify: "text-verify",
    warn: "text-warn",
  }[tone];
  const rule = {
    ink: "border-line-strong",
    fail: "border-fail/40",
    live: "border-live/40",
    verify: "border-verify/40",
    warn: "border-warn/40",
  }[tone];
  return (
    <Reveal>
      <Item>
        <p
          className={clsx(
            "my-10 max-w-[46ch] border-l-2 pl-6 text-[clamp(1.15rem,3vw,1.65rem)] leading-[1.35] font-medium tracking-[-0.02em] text-balance",
            color,
            rule,
          )}
        >
          {children}
        </p>
      </Item>
    </Reveal>
  );
}

/**
 * A box — used only for a genuine interruption.
 *
 * `voice` is somebody speaking; `note` is a caveat or definition. Both are rare
 * on purpose: the page's default is unboxed prose, so a box means "stop, this
 * is a different kind of thing".
 */
export function Box({
  kind = "note",
  label,
  children,
}: {
  kind?: "note" | "voice";
  label?: string;
  children: ReactNode;
}) {
  return (
    <Reveal>
      <Item>
        <aside
          className={clsx(
            "my-8 max-w-[60ch] rounded-xl border px-5 py-4",
            kind === "voice"
              ? "border-line bg-panel/45"
              : "border-verify/25 bg-verify/[0.05]",
          )}
        >
          {label ? (
            <p
              className={clsx(
                "mb-2 font-mono text-[10.5px] tracking-[0.16em] uppercase",
                kind === "voice" ? "text-mist" : "text-verify",
              )}
            >
              {label}
            </p>
          ) : null}
          <div
            className={clsx(
              "text-[14.5px] leading-[1.7]",
              kind === "voice" ? "text-fog italic" : "text-fog",
            )}
          >
            {children}
          </div>
        </aside>
      </Item>
    </Reveal>
  );
}

/** A quieter line — attribution, source, caveat. */
export function Note({ children }: { children: ReactNode }) {
  return (
    <Item>
      <p className="mt-5 max-w-[60ch] text-[13.5px] leading-[1.7] text-mist">
        {children}
      </p>
    </Item>
  );
}

/**
 * A short list set as indented prose. A hairline groups it without drawing a
 * container, which keeps the page reading as one column of text.
 */
export function List({
  items,
  tone = "fail",
  lead = "count",
}: {
  items: readonly (readonly [string, string])[];
  tone?: "fail" | "live" | "verify" | "warn";
  lead?: "count" | "tick" | "dash";
}) {
  const color = {
    fail: "text-fail",
    live: "text-live",
    verify: "text-verify",
    warn: "text-warn",
  }[tone];
  const rule = {
    fail: "border-fail/25",
    live: "border-live/30",
    verify: "border-verify/30",
    warn: "border-warn/30",
  }[tone];

  return (
    <Reveal>
      <div className={clsx("my-7 max-w-[62ch] border-l pl-5 sm:pl-6", rule)}>
        {items.map(([term, rest], i) => (
          <Item key={term}>
            <p className={clsx("text-[15px] leading-[1.65] text-fog sm:text-[16px]", i > 0 && "mt-3.5")}>
              <span className={clsx("mr-2.5 font-mono text-[12px]", color)}>
                {lead === "tick" ? "✓" : lead === "dash" ? "—" : String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-semibold text-ink">{term}</span>
              {rest ? <span className="text-mist"> — {rest}</span> : null}
            </p>
          </Item>
        ))}
      </div>
    </Reveal>
  );
}

/** Bare figures. Where the argument has to land as a number. */
export function Numbers({
  items,
  tone = "fail",
}: {
  items: readonly (readonly [string, string])[];
  tone?: "live" | "fail" | "verify";
}) {
  const color = { live: "text-live", fail: "text-fail", verify: "text-verify" }[tone];
  return (
    <Reveal>
      <div className="my-9 flex flex-wrap gap-x-12 gap-y-7">
        {items.map(([big, small]) => (
          <Item key={small}>
            <div className="max-w-[24ch]">
              <p className={clsx("display text-[clamp(1.8rem,5vw,2.6rem)] leading-none", color)}>
                {big}
              </p>
              <p className="mt-2 text-[13.5px] leading-snug text-mist">{small}</p>
            </div>
          </Item>
        ))}
      </div>
    </Reveal>
  );
}
