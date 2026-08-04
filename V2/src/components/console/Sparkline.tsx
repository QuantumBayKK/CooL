"use client";

/**
 * The trend line inside a stat tile.
 *
 * Deliberately chrome-free: no axes, no grid, no labels. It answers "which way
 * is this going" and nothing else — the tile's own value and delta carry the
 * magnitude, and the full series lives on the page the tile links to. Adding an
 * axis here would turn a glanceable mark into a small bad chart.
 */
import { MARK, linePath } from "./viz";

export function Sparkline({
  values,
  color,
  width = 96,
  height = 26,
  label,
}: {
  values: readonly number[];
  color: string;
  width?: number;
  height?: number;
  /** Screen-reader description — the mark is otherwise decorative. */
  label: string;
}) {
  if (values.length < 2) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const stepX = width / (values.length - 1);
  // 2px inset top and bottom so the stroke is never clipped at the extremes.
  const points = values.map((v, i) => ({
    x: stepX * i,
    y: 2 + (height - 4) - ((v - min) / span) * (height - 4),
  }));
  const last = points.at(-1)!;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
 role="img"
      aria-label={label}
 className="overflow-visible"
    >
      <path
        d={linePath(points)}
 fill="none"
        stroke={color}
        strokeWidth={MARK.lineWidth}
 strokeLinejoin="round"
 strokeLinecap="round"
        opacity={0.85}
      />
      {/* The current period gets the marker — that is the point of the mark. */}
      <circle cx={last.x} cy={last.y} r={2.5} fill={color} />
    </svg>
  );
}
