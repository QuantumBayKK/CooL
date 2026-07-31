"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSpotlight } from "./interactions";

/**
 * ServiceCard — icon, title, body. Used in grids that are already wrapped in a
 * staggered Reveal, so this component does no entrance animation of its own.
 */
export function ServiceCard({
  title,
  description,
  icon,
  className,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
}) {
  const ref = useSpotlight<HTMLDivElement>();
  return (
    <article
      ref={ref}
      className={cn(
        "spot group glass relative h-full overflow-hidden rounded-2xl p-5",
        "transition-transform duration-500 will-change-transform hover:-translate-y-1.5",
        className,
      )}
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-ink/20" />
      <span
        aria-hidden
        className="spot-layer pointer-events-none absolute inset-0"
      />
      <div className="relative z-10">
        {icon ? (
          <div className="mb-5 flex size-10 items-center justify-center rounded-xl border border-verify/25 bg-verify/[0.08] text-verify">
            {icon}
          </div>
        ) : null}
        <h3 className="font-mono text-[15px] font-semibold text-ink">{title}</h3>
        <p className="mt-3 text-[14px] leading-relaxed text-mist">
          {description}
        </p>
      </div>
    </article>
  );
}
