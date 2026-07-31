"use client";

import type { ReactNode } from "react";
import { useMagnetic } from "@/components/ui/interactions";

/**
 * Magnetic hover — the element leans toward the cursor, then springs home.
 * anime.js does the springing; the listeners live on the element itself, so
 * this costs nothing until the pointer is actually over it. No-op on touch.
 */
export default function Magnetic({
  children,
  strength = 14,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useMagnetic<HTMLDivElement>(strength);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
