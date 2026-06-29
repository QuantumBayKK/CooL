import { createElement, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Voice = "narrator" | "witness";
type Size = "cinema" | "display" | "headline" | "body-lg" | "body" | "caption";

const SIZE_CLASS: Record<Size, string> = {
  cinema: "text-cinema leading-[1.06] tracking-[-0.015em]",
  display: "text-display leading-[1.1] tracking-[-0.01em]",
  headline: "text-headline leading-[1.18] tracking-[-0.005em]",
  "body-lg": "text-body-lg leading-[1.55]",
  body: "text-body leading-[1.6]",
  caption: "text-caption uppercase tracking-[0.18em]",
};

const VOICE_CLASS: Record<Voice, string> = {
  narrator: "font-narrator font-light text-balance",
  witness: "font-witness",
};

export interface CinematicLineProps {
  children: ReactNode;
  as?: ElementType;
  voice?: Voice;
  size?: Size;
  className?: string;
  /** Hidden from AT when the same text is announced elsewhere (avoid double-read). */
  ariaHidden?: boolean;
}

/**
 * The Narrator / Witness type voices (CDS §3.2). A line of "dialogue spoken by the
 * film itself." Animation is applied by the parent scene timeline (it targets the
 * element), keeping this a pure, reusable presentation primitive.
 */
export function CinematicLine({
  children,
  as: Tag = "p",
  voice = "narrator",
  size = "display",
  className,
  ariaHidden,
}: CinematicLineProps) {
  // createElement avoids the polymorphic `children: never` inference that JSX hits
  // when the tag type is a broad ElementType.
  return createElement(
    Tag,
    {
      "aria-hidden": ariaHidden || undefined,
      className: cn(VOICE_CLASS[voice], SIZE_CLASS[size], className),
    },
    children,
  );
}
