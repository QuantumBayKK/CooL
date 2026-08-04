"use client";

/**
 * A single proportion, as a bar.
 *
 * Used wherever the answer is one percentage — evidence coverage, compliance
 * posture, an SLA. The unfilled track is a lighter wash of the same fill rather
 * than a neutral gray, so the state reads across the whole bar rather than only
 * across the filled part.
 *
 * A one-bar bar chart would be the wrong form here; a meter plus its number is
 * the right one, and the number is always present so the bar never carries the
 * value alone.
 */
export function Meter({
  value,
  max = 100,
  color,
  height = 8,
  label,
}: {
  value: number;
  max?: number;
  color: string;
  height?: number;
  label: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
 role="meter"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
 className="w-full overflow-hidden"
      style={{ height, background: `color-mix(in srgb, ${color} 16%, transparent)` }}
    >
      <div
 className="h-full"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}
