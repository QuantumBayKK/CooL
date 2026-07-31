"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

/** Typewriter — types once when scrolled into view. */
export default function TypeText({
  text,
  className,
  speed = 42,
  startDelay = 0,
}: {
  text: string;
  className?: string;
  speed?: number;
  startDelay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  const done = shown >= text.length;

  useEffect(() => {
    if (!inView || reduced) return;
    let i = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const timer = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setShown(i);
        if (i >= text.length && interval) clearInterval(interval);
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [inView, reduced, text, speed, startDelay]);

  if (reduced) return <span className={className}>{text}</span>;

  return (
    <span ref={ref} className={className}>
      {text.slice(0, shown)}
      {inView && !done && <span className="animate-pulse">▌</span>}
    </span>
  );
}
