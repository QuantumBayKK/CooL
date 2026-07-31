"use client";

import clsx from "clsx";

/**
 * Border beam — a point of light travels the border of the block it wraps.
 * Draws the investor's eye to the ask. CSS-only.
 */
export default function BorderBeam({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx(
        "border-beam pointer-events-none absolute inset-0 rounded-[inherit]",
        className,
      )}
    />
  );
}
