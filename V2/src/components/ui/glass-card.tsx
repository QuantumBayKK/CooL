"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSpotlight } from "./interactions";

/**
 * GlassCard — frosted pane with a spotlight that tracks the cursor.
 *
 * Purely presentational: entrances are the caller's job (wrap it in Reveal), so
 * a card placed inside an already-animating group is never double-animated.
 * The spotlight is a static radial-gradient positioned from two CSS custom
 * properties, so following the pointer costs one style write per frame and no
 * JS animation at all.
 */
export function GlassCard({
  children,
  className,
  spotlight = true,
}: {
  children: ReactNode;
  className?: string;
  spotlight?: boolean;
}) {
  const ref = useSpotlight<HTMLDivElement>();
  return (
    <div
      ref={ref}
      // cn (tailwind-merge) so a caller's `p-4` actually replaces the default
      // `p-5` instead of both landing in the class list
      className={cn(
        "spot group glass relative h-full overflow-hidden rounded-2xl p-5",
        "transition-colors duration-300 hover:border-verify/30",
        className,
      )}
    >
      {/* lit top edge */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-ink/20" />
      {spotlight ? (
        <span
          aria-hidden
          className="spot-layer pointer-events-none absolute inset-0"
        />
      ) : null}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
