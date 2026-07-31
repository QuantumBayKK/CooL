"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

/**
 * Continuous ticker — content streams slowly, pauses on hover.
 * CSS-driven; duplicated track for a seamless loop.
 */
export default function Ticker({
  children,
  className,
  seconds = 36,
}: {
  children: ReactNode;
  className?: string;
  seconds?: number;
}) {
  return (
    <div className={clsx("ticker edge-fade overflow-hidden", className)}>
      <div
        className="ticker-track flex w-max items-center gap-2 pr-2"
        style={{ animationDuration: `${seconds}s` }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
