"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { usePress } from "./interactions";

const shell =
  "group relative isolate inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-full " +
  "border border-line bg-panel/70 px-7 py-4 font-mono text-sm font-semibold tracking-wide text-fog " +
  "backdrop-blur-xl transition-colors duration-300 hover:border-verify/45 hover:text-ink";

/** GlassButton — the quiet secondary action. Frosted, no glow. */
export function GlassButton({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & ComponentPropsWithoutRef<"button">) {
  const { ref, handlers } = usePress<HTMLButtonElement>();
  return (
    <button ref={ref} {...handlers} {...rest} className={clsx(shell, className)}>
      <span aria-hidden className="absolute inset-x-6 top-0 h-px bg-ink/25" />
      <span aria-hidden className="sheen absolute inset-0 rounded-full" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

export function GlassLink({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & ComponentPropsWithoutRef<"a">) {
  const { ref, handlers } = usePress<HTMLAnchorElement>();
  return (
    <a ref={ref} {...handlers} {...rest} className={clsx(shell, className)}>
      <span aria-hidden className="absolute inset-x-6 top-0 h-px bg-ink/25" />
      <span aria-hidden className="sheen absolute inset-0 rounded-full" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </a>
  );
}
