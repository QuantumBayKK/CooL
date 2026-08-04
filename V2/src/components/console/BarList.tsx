"use client";

/**
 * A ranked horizontal bar list — the workhorse for "which of these is biggest".
 *
 * One series, so every bar takes the same slot-1 hue and there is no legend:
 * colouring bars darker-where-bigger would spend the identity channel
 * re-encoding what bar length already shows. Categories that carry their own
 * meaning (a risk band, a connector status) can override per row via `color`,
 * which is how status tokens enter without becoming a series palette.
 *
 * Values are direct-labelled at the tip. That is legal here precisely because
 * there are few rows — the "never label every point" rule is about dense
 * charts, and a ranked list of eight is the case where the label IS the axis.
 */
import { ChartFrame, MARK, TipBody, barPathH, niceMax, useTooltip } from "./viz";
import { SERIES } from "@/lib/console-theme";
import type { TableView } from "./viz";
import { formatNumber, type NumberFormat } from "@/lib/console-format";

export interface BarRow {
  readonly label: string;
  readonly value: number;
  /** Optional per-row override, for status-coloured rows. */
  readonly color?: string;
  /** Extra context shown in the tooltip. */
  readonly note?: string;
  /** A secondary figure shown to the right of the value. */
  readonly meta?: string;
}

export function BarList({
  title,
  subtitle,
  rows,
  format = "plain",
  valueLabel = "Value",
  barHeight = 10,
  action,
  emptyNote = "Nothing in range.",
}: {
  title: string;
  subtitle?: string;
  rows: readonly BarRow[];
  format?: NumberFormat;
  valueLabel?: string;
  barHeight?: number;
  action?: React.ReactNode;
  emptyNote?: string;
}) {
  const { wrapRef, show, hide, tipNode } = useTooltip();
  // Tokens cross the server/client boundary; the formatter is built here.
  const fmt = (value: number) => formatNumber(format, value);
  const max = niceMax(Math.max(1, ...rows.map((r) => r.value)));

  const table: TableView = {
    columns: ["Item", valueLabel, ...(rows.some((r) => r.meta) ? ["Detail"] : [])],
    rows: rows.map((r) => [r.label, fmt(r.value), ...(r.meta ? [r.meta] : r.note ? [r.note] : rows.some((x) => x.meta) ? [""] : [])]),
  };

  return (
    <ChartFrame title={title} subtitle={subtitle} table={table} action={action}>
      <div ref={wrapRef} className="relative" onMouseLeave={hide}>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-mist">{emptyNote}</p>
        ) : (
          <ul className="space-y-2.5">
            {rows.map((row) => {
              const width = (row.value / max) * 100;
              return (
                <li
                  key={row.label}
                  // The row is the hit target, not the 10px bar.
                  style={{ minHeight: MARK.minHitTarget }}
 className="flex flex-col justify-center"
                  onMouseMove={(e) =>
                    show(
                      e,
                      <TipBody
                        title={row.label}
                        rows={[
                          { label: valueLabel, value: fmt(row.value), color: row.color ?? SERIES[0] },
                          ...(row.note ? [{ label: "", value: row.note }] : []),
                        ]}
                      />,
                    )
                  }
                >
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="truncate text-[12px] text-fog">{row.label}</span>
                    <span className="shrink-0 tnum text-[12px] text-ink">
                      {fmt(row.value)}
                      {row.meta ? <span className="ml-2 text-mist">{row.meta}</span> : null}
                    </span>
                  </div>
                  <svg
                    viewBox={`0 0 100 ${barHeight}`}
 width="100%"
                    height={barHeight}
 preserveAspectRatio="none"
                    aria-hidden
                  >
                    <rect
                      x={0}
                      y={0}
                      width={100}
                      height={barHeight}
 fill="rgba(223,228,234,0.05)"
                    />
                    <path
                      d={barPathH(0, 0, width, barHeight, 3)}
                      fill={row.color ?? SERIES[0]}
                    />
                  </svg>
                </li>
              );
            })}
          </ul>
        )}
        {tipNode}
      </div>
    </ChartFrame>
  );
}
