"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Reveal, Kicker, FLUID } from "@/components/ui";

export type FrameMode = "fall" | "left" | "right";

/** true once the viewport is desktop-sized — 3D swings are desktop-only */
function useDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

/**
 * SlideFrame — 3D slide transitions, scrubbed by scroll:
 *   fall  — the wall tips forward from the top edge to reveal the slide
 *   left  — the frame swings in around the vertical axis, from the left
 *   right — same, from the right
 * Desktop only. On phones the swing reads as side-to-side play while
 * scrolling, so mobile gets a clean fade + settle instead.
 */
export function SlideFrame({
  mode,
  children,
  className,
}: {
  mode: FrameMode;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const desktop = useDesktop();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rx = useTransform(
    scrollYProgress,
    [0, 0.32, 0.68, 1],
    desktop && mode === "fall" ? [-10, 0, 0, 6] : [0, 0, 0, 0],
  );
  const ry = useTransform(
    scrollYProgress,
    [0, 0.32, 0.68, 1],
    desktop && mode === "left"
      ? [9, 0, 0, -6]
      : desktop && mode === "right"
        ? [-9, 0, 0, 6]
        : [0, 0, 0, 0],
  );
  /* The scroll-linked fade and scale are a DESKTOP effect only.
     On a phone these slides are frequently taller than the screen, and this
     progress runs "slide top enters" → "slide bottom leaves". A tall slide
     therefore sits near the ends of that range for most of the time you are
     actually reading it, which dimmed real content to 50% and read as the
     slide failing to render. Mobile keeps the Reveal entrance and nothing
     scroll-linked, so a slide is either on screen and fully legible, or it
     isn't. */
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.22, 0.78, 1],
    desktop ? [0.5, 1, 1, 0.5] : [1, 1, 1, 1],
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 0.32, 0.68, 1],
    desktop ? [0.975, 1, 1, 0.975] : [1, 1, 1, 1],
  );

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        rotateX: rx,
        rotateY: ry,
        opacity,
        scale,
        transformPerspective: 1400,
        transformOrigin: mode === "fall" ? "50% 0%" : "50% 50%",
      }}
    >
      {children}
    </motion.div>
  );
}

/** cycle transitions so consecutive slides never move the same way */
export const frameModeFor = (no: string): FrameMode =>
  (["fall", "left", "right"] as const)[(parseInt(no, 10) - 1) % 3]!;

/* One deck slide = one full-viewport section, numbered exactly like the PPTX. */
export function Slide({
  id,
  no,
  kicker,
  title,
  sub,
  children,
  wide = false,
  center = false,
}: {
  id: string;
  no: string;
  kicker: string;
  title: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  wide?: boolean;
  center?: boolean;
}) {
  return (
    <section
      id={id}
      data-slide={no}
      data-layer={`${no} · ${kicker}`}
      className={clsx(
        "relative mx-auto flex min-h-[100svh] w-full snap-start flex-col justify-center px-5 pt-24 pb-16 sm:pt-28 sm:pb-20",
        wide ? "max-w-5xl" : "max-w-xl md:max-w-2xl",
        center && "items-center text-center",
      )}
    >
      <SlideFrame mode={frameModeFor(no)}>
        <Reveal>
          <Kicker>{kicker}</Kicker>
          {/* observe the (unclipped) wrapper, not the h2: at y:108% the h2 is
              fully clipped by overflow-hidden, and a fully-clipped element
              never intersects — whileInView on it would never fire on a
              deep-linked load (#ask from an Instagram bio, say) */}
          <motion.div
            className="overflow-hidden pt-1"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.h2
              className="display mt-2 text-[clamp(2.3rem,9.5vw,3.6rem)]"
              variants={{
                hidden: { y: "108%", skewY: 2.5 },
                show: {
                  y: "0%",
                  skewY: 0,
                  transition: { duration: 1, ease: FLUID },
                },
              }}
            >
              {title}
            </motion.h2>
          </motion.div>
          {sub ? (
            <p
              className={clsx(
                "mt-3.5 max-w-prose text-[16px] leading-relaxed font-medium text-fog sm:text-[17px]",
                center && "mx-auto",
              )}
            >
              {sub}
            </p>
          ) : null}
        </Reveal>
        {children ? <div className="mt-6 sm:mt-7">{children}</div> : null}
      </SlideFrame>
    </section>
  );
}

const SLIDE_IDS = [
  "cover",
  "problem",
  "solution",
  "technology",
  "proof",
  "validation",
  "market",
  "model",
  "competition",
  "gtm",
  "team",
  "funds",
  "ask",
];

/* Desktop dot rail — 13 slides, active tracking, click to jump. */
export function SlideRail() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = SLIDE_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => !!el,
    );
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(SLIDE_IDS.indexOf(e.target.id));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav
      aria-label="Slides"
      className="fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 flex-col gap-2.5 lg:flex"
    >
      {SLIDE_IDS.map((id, i) => (
        <a
          key={id}
          href={`#${id}`}
          aria-label={`Slide ${i + 1}`}
          className={clsx(
            "rounded-full transition-all duration-300",
            i === active
              ? "h-5 w-1.5 bg-verify shadow-[0_0_8px_rgba(88,166,255,0.6)]"
              : "size-1.5 bg-ink/25 hover:bg-ink/40",
          )}
        />
      ))}
    </nav>
  );
}
