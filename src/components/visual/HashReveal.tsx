"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const HEX = "0123456789abcdef";

function scramble(target: string, settled: number): string {
  let out = "";
  for (let i = 0; i < target.length; i++) {
    const ch = target[i] ?? "";
    if (i < settled || !HEX.includes(ch)) {
      out += ch;
    } else {
      out += HEX[Math.floor(Math.random() * HEX.length)];
    }
  }
  return out;
}

export interface HashRevealProps {
  /** The final hex string to resolve to (non-hex chars like ':' pass through). */
  value: string;
  className?: string;
  /** ms between settling one more character. */
  speed?: number;
}

/**
 * A hash that "decrypts" into place — hex characters tumble, then settle left-to-right.
 * The crypto motif made tangible (CDS: motion communicates meaning). The animation
 * waits until the element scrolls into view (otherwise it would finish several
 * viewports before anyone sees it) and re-runs when the value changes (e.g. a record
 * is sealed). Respectful of perf — a single interval, one observer.
 */
export function HashReveal({ value, className, speed = 35 }: HashRevealProps) {
  // Render the final value on the server / first paint (deterministic markup);
  // the tumble starts only once visible.
  const [text, setText] = useState(value);
  const [inView, setInView] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let settled = 0;
    if (timer.current) window.clearInterval(timer.current);
    setText(scramble(value, 0));
    timer.current = window.setInterval(() => {
      settled += 1;
      setText(scramble(value, settled));
      if (settled >= value.length && timer.current) {
        window.clearInterval(timer.current);
        timer.current = null;
        setText(value);
      }
    }, speed);

    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [inView, value, speed]);

  return (
    <span ref={spanRef} className={cn("font-instrument tabular-nums", className)} aria-label={value}>
      {text}
    </span>
  );
}
