"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { usePress } from "./interactions";

/**
 * ShimmerButton — the primary action.
 *
 * A conic-gradient light walks the border (CSS `beam-spin`, so the compositor
 * owns the loop), a sheen wipes across on hover, and anime.js handles the
 * hover-lift and press. Renders as <button> or, with `href`, as an <a>.
 */
type Base = {
  children: ReactNode;
  className?: string;
  /** dial the border light down for secondary placements */
  quiet?: boolean;
};

export function ShimmerButton({
  children,
  className,
  quiet = false,
  ...rest
}: Base & ComponentPropsWithoutRef<"button">) {
  const { ref, handlers } = usePress<HTMLButtonElement>();
  return (
    <button
      ref={ref}
      {...handlers}
      {...rest}
      className={clsx(shell, className)}
    >
      <Skin quiet={quiet} />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}

export function ShimmerLink({
  children,
  className,
  quiet = false,
  ...rest
}: Base & ComponentPropsWithoutRef<"a">) {
  const { ref, handlers } = usePress<HTMLAnchorElement>();
  return (
    <a ref={ref} {...handlers} {...rest} className={clsx(shell, className)}>
      <Skin quiet={quiet} />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </a>
  );
}

const shell =
  "group relative isolate inline-flex select-none items-center justify-center overflow-hidden rounded-full px-8 py-4 font-mono text-sm font-semibold tracking-wide text-white " +
  "shadow-[0_0_34px_rgba(31,111,235,0.34),0_10px_30px_rgba(0,0,0,0.45)] transition-shadow duration-500 hover:shadow-[0_0_52px_rgba(88,166,255,0.5),0_14px_36px_rgba(0,0,0,0.5)]";

function Skin({ quiet }: { quiet: boolean }) {
  return (
    <>
      {/* the light that walks the border */}
      <span
        aria-hidden
        className={clsx(
          "shimmer-ring absolute inset-0 rounded-full",
          quiet && "opacity-45",
        )}
      />
      {/* body, inset by the 1px ring */}
      <span
        aria-hidden
        className="absolute inset-[1px] rounded-full bg-gradient-to-b from-verify-deep to-[#0d4da8]"
      />
      {/* top highlight — reads as a lit edge */}
      <span
        aria-hidden
        className="absolute inset-x-6 top-[1px] h-px rounded-full bg-white/45"
      />
      {/* hover sheen */}
      <span aria-hidden className="sheen absolute inset-[1px] rounded-full" />
    </>
  );
}
