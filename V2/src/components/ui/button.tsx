import { Slot } from "@/components/ui/slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Button.
 *
 * Four variants and no more. Every additional variant is a decision the next
 * person has to make correctly, and a page with five kinds of button has no
 * primary action at all.
 *
 *   primary   — the one action this view exists for. One per viewport.
 *   secondary — the alternative. Bordered, not filled.
 *   ghost     — chrome. Nav items, toolbar controls, table row actions.
 *   danger    — destructive and irreversible. Revoke a code, delete a session.
 *
 * `primary` is filled with `--accent`, which is deep red on marketing surfaces
 * and ink inside `[data-surface="console"]`. That switch is in globals.css, not
 * here, so the button never has to know which surface it is on.
 *
 * Motion: a 140ms colour transition and nothing else. No lift, no scale, no
 * shadow bloom. The active state is a 1px nudge, which is the whole budget —
 * it reads as a physical press without anything travelling.
 */
const button = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "font-medium select-none",
    "rounded-[--radius-sm]",
    "transition-[background-color,border-color,color] duration-[--duration-state] ease-[--ease-out]",
    "active:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-accent text-on-accent hover:bg-accent-hover",
        secondary:
          "border border-line-strong bg-canvas text-ink hover:bg-raised hover:border-ink-subtle",
        ghost: "text-ink-muted hover:bg-raised hover:text-ink",
        danger:
          "border border-fail/30 bg-fail-wash text-fail hover:bg-fail hover:text-on-accent hover:border-fail",
      },
      size: {
        sm: "h-8 px-3 text-[0.8125rem]",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-[0.9375rem]",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ComponentProps<"button">,
    VariantProps<typeof button> {
  /** Render as the child element (e.g. a `next/link`) instead of a `<button>`. */
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(button({ variant, size }), className)} {...props} />
  );
}

export { button as buttonVariants };
