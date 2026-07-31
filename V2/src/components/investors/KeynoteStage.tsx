"use client";

import { createContext, useContext, type ReactNode } from "react";
import clsx from "clsx";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * One keynote stage: a full screen holding exactly one idea.
 *
 * The discipline this enforces is the point. A stage is `100svh` and centred,
 * so anything that does not fit is a signal that the stage is trying to say two
 * things and should be split — which is what keeps a keynote from decaying back
 * into a scrolling document.
 *
 * That constraint is also why these fit on a phone. The deck slides had to be
 * un-snapped on touch because dense content outgrew the viewport; here the
 * content is sparse by construction, so the same full-screen framing holds at
 * 390px without trapping anyone.
 *
 * Children animate in sequence via {@link Build}. The stagger is deliberately
 * slow — a keynote build lands one beat at a time, and rushing it is what makes
 * web imitations feel like a slideshow instead of a presentation.
 */

const FLUID = [0.16, 1, 0.3, 1] as const;

const StageMotion = createContext(false);

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.11, delayChildren: 0.04 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(9px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.82, ease: FLUID },
  },
};

const still: Variants = { hidden: {}, show: {} };

export function Stage({
  no,
  children,
  className,
  align = "center",
}: {
  /** Two-digit index — drives the progress rail and the snap point. */
  no: string;
  children: ReactNode;
  className?: string;
  align?: "center" | "start";
}) {
  const reduced = useReducedMotion();

  return (
    <section
      id={`stage-${no}`}
      data-slide={no}
      className={clsx(
        // scroll-mt keeps an anchored jump clear of the fixed chrome
        "relative mx-auto flex min-h-[100svh] w-full max-w-5xl scroll-mt-0 flex-col px-6 py-24 sm:px-8",
        align === "center" ? "justify-center" : "justify-center",
        className,
      )}
    >
      <StageMotion.Provider value={!reduced}>
        <motion.div
          variants={reduced ? still : container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
          className="w-full"
        >
          {children}
        </motion.div>
      </StageMotion.Provider>
    </section>
  );
}

/** One beat of a stage's build. Wrap each element that should land on its own. */
export function Build({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const animated = useContext(StageMotion);
  return (
    <motion.div variants={animated ? item : still} className={className}>
      {children}
    </motion.div>
  );
}

/** The small line above a stage's headline. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Build>
      <p className="font-mono text-[11px] tracking-[0.22em] text-verify uppercase sm:text-[12px]">
        {children}
      </p>
    </Build>
  );
}

/** The stage's one sentence. Sized to dominate the screen. */
export function Headline({
  children,
  size = "lg",
}: {
  children: ReactNode;
  size?: "lg" | "xl";
}) {
  return (
    <Build>
      <h2
        className={clsx(
          "keynote mt-4",
          size === "xl"
            ? "text-[clamp(2.1rem,7.5vw,4.6rem)]"
            : "text-[clamp(1.75rem,5.6vw,3.4rem)]",
        )}
      >
        {children}
      </h2>
    </Build>
  );
}

/** Supporting sentence under a headline. One only — this is a keynote. */
export function Lead({ children }: { children: ReactNode }) {
  return (
    <Build>
      <p className="keynote-lead mt-5 max-w-2xl text-[15.5px] sm:text-[17.5px]">
        {children}
      </p>
    </Build>
  );
}
