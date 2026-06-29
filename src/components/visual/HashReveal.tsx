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
 * The crypto motif made tangible (CDS: motion communicates meaning). Re-runs when the
 * value changes (e.g. a record is sealed). Respectful of perf — a single interval.
 */
export function HashReveal({ value, className, speed = 35 }: HashRevealProps) {
  const [text, setText] = useState(value);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let settled = 0;
    if (timer.current) window.clearInterval(timer.current);
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
  }, [value, speed]);

  return (
    <span className={cn("font-instrument tabular-nums", className)} aria-label={value}>
      {text}
    </span>
  );
}
