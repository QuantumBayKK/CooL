"use client";

/**
 * Columns over time, single-series or stacked.
 *
 * Used for the change feed's daily volume. Stacking is the right form here
 * because the reader wants both the total per day and its composition, and the
 * segments sum to something meaningful. Segments are separated by a 2px gap in
 * the surface colour rather than a stroke.
 *
 * The container height includes the x-axis band, so the card never grows a
 * nested scrollbar to show its own tick labels.
 */
import { ChartFrame, GridLines, MARK, TipBody, YTicks, barPath, niceMax, ticks, useTooltip } from "./viz";
import { SURFACE } from "@/lib/console-theme";
import type { LegendItem, TableView } from "./viz";
import { formatNumber, type NumberFormat } from "@/lib/console-format";

export interface ColumnSeries {
  readonly label: string;
  readonly color: string;
  /** One value per category, same length and order as `categories`. */
  readonly values: readonly number[];
}

export function ColumnChart({
  title,
  subtitle,
  categories,
  series,
  height = 200,
  format = "plain",
  /** Show every nth category label; the rest are tick marks only. */
  labelEvery = 1,
  action,
}: {
  title: string;
  subtitle?: string;
  categories: readonly string[];
  series: readonly ColumnSeries[];
  height?: number;
  format?: NumberFormat;
  labelEvery?: number;
  action?: React.ReactNode;
}) {
  const { wrapRef, show, hide, tipNode } = useTooltip();
  // Tokens cross the server/client boundary; the formatter is built here.
  const fmt = (value: number) => formatNumber(format, value);

  const PAD = { top: 8, right: 4, bottom: 22, left: 34 };
  const plotHeight = height - PAD.top - PAD.bottom;

  const totals = categories.map((_, i) =>
    series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0),
  );
  const max = niceMax(Math.max(1, ...totals));
  const tickValues = ticks(max, 4);

  // Percentage geometry inside a viewBox: the chart fills its container at any
  // width, and the bar band is computed from the category count rather than a
  // fixed pixel width.
  const VW = 640;
  const plotWidth = VW - PAD.left - PAD.right;
  const band = plotWidth / categories.length;
  const barWidth = Math.min(MARK.maxBarThickness, band * 0.62);

  const scaleY = (v: number) => PAD.top + plotHeight - (v / max) * plotHeight;

  const legend: LegendItem[] = series.map((s) => ({ label: s.label, color: s.color }));

  const table: TableView = {
    columns: ["Day", ...series.map((s) => s.label), "Total"],
    rows: categories.map((category, i) => [
      category,
      ...series.map((s) => fmt(s.values[i] ?? 0)),
      fmt(totals[i] ?? 0),
    ]),
  };

  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      legend={legend}
      table={table}
      action={action}
    >
      <div ref={wrapRef} className="relative" onMouseLeave={hide}>
        <svg
          viewBox={`0 0 ${VW} ${height}`}
 width="100%"
          height={height}
 role="img"
          aria-label={`${title}. ${subtitle ?? ""} Values are listed in the table view below.`}
 preserveAspectRatio="none"
        >
          <GridLines values={tickValues} scaleY={scaleY} width={VW - PAD.right} left={PAD.left} />
          <YTicks values={tickValues} scaleY={scaleY} format={fmt} left={PAD.left} />

          {categories.map((category, i) => {
            const x = PAD.left + band * i + (band - barWidth) / 2;
            let cursor = PAD.top + plotHeight;

            return (
              <g key={category}>
                {series.map((s, si) => {
                  const value = s.values[i] ?? 0;
                  if (value <= 0) return null;
                  const rawHeight = (value / max) * plotHeight;
                  // Reserve the surface gap out of each segment except the one
                  // sitting on the baseline, so the stack still sums correctly.
                  const gap = si === 0 ? 0 : MARK.surfaceGap;
                  const segmentHeight = Math.max(0, rawHeight - gap);
                  const y = cursor - segmentHeight;
                  cursor -= rawHeight;
                  // Only the topmost drawn segment gets the data-end.
                  const isTop = series.slice(si + 1).every((rest) => (rest.values[i] ?? 0) <= 0);
                  return (
                    <path
                      key={s.label}
                      d={barPath(x, y, barWidth, segmentHeight, isTop ? MARK.barRadius : 0)}
                      fill={s.color}
                    />
                  );
                })}

                {/* A full-height hit target — the pointer never has to find a
                    2px segment, and it works on days with no bar at all. */}
                <rect
                  x={PAD.left + band * i}
                  y={PAD.top}
                  width={band}
                  height={plotHeight}
 fill="transparent"
                  onMouseMove={(e) =>
                    show(
                      e,
                      <TipBody
                        title={category}
                        rows={[
                          ...series
                            .filter((s) => (s.values[i] ?? 0) > 0)
                            .map((s) => ({
                              label: s.label,
                              value: fmt(s.values[i] ?? 0),
                              color: s.color,
                            })),
                          { label: "Total", value: fmt(totals[i] ?? 0) },
                        ]}
                      />,
                    )
                  }
                />
              </g>
            );
          })}

          {/* X labels, thinned so they never collide. */}
          <g aria-hidden>
            {categories.map((category, i) =>
              i % labelEvery === 0 ? (
                <text
                  key={category}
                  x={PAD.left + band * i + band / 2}
                  y={height - 6}
 textAnchor="middle"
                  fontSize={10}
 fill="#848e9b"
                >
                  {category}
                </text>
              ) : null,
            )}
          </g>
        </svg>
        {tipNode}
      </div>
    </ChartFrame>
  );
}

/** Surface colour, exported for callers that need to match the gap. */
export const GAP_COLOR = SURFACE.panel;
