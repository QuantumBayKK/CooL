"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { usePress } from "./interactions";

const shell =
  "group relative isolate inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-full " +
  "border border-ink/20 bg-ink/[0.08] px-8 py-4 font-mono text-sm font-semibold tracking-wide text-ink " +
  "shadow-[0_12px_40px_rgba(0,0,0,0.32)] backdrop-blur-2xl transition-colors duration-300 hover:bg-ink/[0.14]";

/**
 * LiquidGlassButton — heavy frosted glass with a lit top edge and a refractive
 * inner shadow. Reads as a physical pane rather than a painted rectangle.
 */
export function LiquidGlassButton({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & ComponentPropsWithoutRef<"button">) {
  const { ref, handlers } = usePress<HTMLButtonElement>();
  return (
    <button ref={ref} {...handlers} {...rest} className={clsx(shell, className)}>
      <Skin />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

export function LiquidGlassLink({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & ComponentPropsWithoutRef<"a">) {
  const { ref, handlers } = usePress<HTMLAnchorElement>();
  return (
    <a ref={ref} {...handlers} {...rest} className={clsx(shell, className)}>
      <Skin />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </a>
  );
}

function Skin() {
  return (
    <>
      {/* lit top edge */}
      <span
        aria-hidden
        className="absolute inset-x-1/4 top-0 h-px bg-ink/70 opacity-70"
      />
      {/* refraction — a soft bright pool at the top, darkness pooling low */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(240,246,252,0.16),transparent_70%)]"
      />
      <span aria-hidden className="sheen absolute inset-0 rounded-full" />
    </>
  );
}
