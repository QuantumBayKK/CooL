import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared vocabulary for the architecture diagrams.
 *
 * Every diagram on this site is hand-authored SVG rather than an exported
 * image, for three reasons that all matter here:
 *
 *   · it inherits the theme, so there is no second asset for dark mode and no
 *     white rectangle sitting on a black canvas;
 *   · the text is real text, so it is selectable, searchable and scales with
 *     the reader's font settings;
 *   · it is diffable, so a change to the architecture shows up in review as a
 *     change to the diagram rather than as an opaque binary blob.
 *
 * Fills and strokes use `currentColor` and the token classes, never literal
 * hex. A literal would survive the theme switch and become invisible.
 */

export function Figure({
  caption,
  children,
  className,
  label,
}: {
  caption: ReactNode;
  children: ReactNode;
  className?: string;
  /** Accessible name for the graphic. Required — a diagram without one is invisible to a screen reader. */
  label: string;
}) {
  return (
    <figure className={cn("border border-line bg-canvas", className)}>
      <div data-scroll className="overflow-x-auto p-5 sm:p-7">
        <div role="img" aria-label={label} className="min-w-[38rem]">
          {children}
        </div>
      </div>
      <figcaption className="border-t border-line px-5 py-3 text-xs text-ink-subtle sm:px-7">
        {caption}
      </figcaption>
    </figure>
  );
}

/** A labelled box. `tone` maps to the status vocabulary, not to decoration. */
export function Box({
  x,
  y,
  w,
  h,
  title,
  sub,
  tone = "default",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  tone?: "default" | "accent" | "muted" | "warn";
}) {
  const fill =
    tone === "accent"
      ? "fill-accent-wash"
      : tone === "warn"
        ? "fill-warn-wash"
        : tone === "muted"
          ? "fill-surface"
          : "fill-canvas";

  const stroke =
    tone === "accent"
      ? "stroke-accent/40"
      : tone === "warn"
        ? "stroke-warn/40"
        : "stroke-line-strong";

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={3}
        className={cn(fill, stroke)}
        strokeWidth={1}
      />
      <text
        x={x + 14}
        y={y + (sub ? 24 : h / 2 + 4)}
        className="fill-ink text-[12px] font-medium"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {title}
      </text>
      {sub && (
        <text
          x={x + 14}
          y={y + 42}
          className="fill-ink-subtle text-[10.5px]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {sub}
        </text>
      )}
    </g>
  );
}

/**
 * A connector.
 *
 * Orthogonal by default — diagonal lines in an architecture diagram read as
 * "roughly connected to", and every relationship here is exact.
 */
export function Arrow({
  d,
  label,
  labelX,
  labelY,
  dashed = false,
  tone = "default",
}: {
  d: string;
  label?: string;
  labelX?: number;
  labelY?: number;
  dashed?: boolean;
  tone?: "default" | "accent";
}) {
  const stroke = tone === "accent" ? "stroke-accent" : "stroke-line-strong";
  const marker = tone === "accent" ? "url(#arrow-accent)" : "url(#arrow-default)";

  return (
    <g>
      <path
        d={d}
        className={cn(stroke, "fill-none")}
        strokeWidth={1.25}
        strokeDasharray={dashed ? "3 3" : undefined}
        markerEnd={marker}
      />
      {label && labelX != null && labelY != null && (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          className="fill-ink-subtle text-[10px]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/**
 * Arrow markers.
 *
 * Defined once per diagram. `context-stroke` would be ideal but Safari's
 * support is uneven, so the markers carry explicit token classes instead.
 */
export function ArrowDefs() {
  return (
    <defs>
      <marker
        id="arrow-default"
        viewBox="0 0 8 8"
        refX="7"
        refY="4"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M0 1 L7 4 L0 7 z" className="fill-line-strong" />
      </marker>
      <marker
        id="arrow-accent"
        viewBox="0 0 8 8"
        refX="7"
        refY="4"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M0 1 L7 4 L0 7 z" className="fill-accent" />
      </marker>
    </defs>
  );
}

/** A dashed trust boundary with a label in its top-left corner. */
export function Boundary({
  x,
  y,
  w,
  h,
  label,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={4}
        className="fill-none stroke-ink-subtle/45"
        strokeWidth={1}
        strokeDasharray="5 4"
      />
      <text
        x={x + 10}
        y={y + 16}
        className="fill-ink-subtle text-[10px] uppercase"
        style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}
      >
        {label}
      </text>
    </g>
  );
}
