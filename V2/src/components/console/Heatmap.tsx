"use client";

/**
 * A magnitude grid — workflows × days, or workflows × risk drivers.
 *
 * Colour encodes magnitude, so this is the sequential ramp: one hue, low to
 * high, bucketed into five discrete steps rather than interpolated. Buckets are
 * deliberate — a reader can match a cell back to a legend swatch exactly, which
 * a continuous gradient makes impossible.
 *
 * The ramp's low end still clears 2.68:1 against the panel, so "small but
 * present" never disappears into the surface. Zero is drawn as an empty track
 * instead, because "none" and "a little" are different answers.
 */
import { ChartFrame, MARK, TipBody, useTooltip } from "./viz";
import { SEQUENTIAL, sequentialStep } from "@/lib/console-theme";
import type { TableView } from "./viz";
import { formatNumber, type NumberFormat } from "@/lib/console-format";

export interface HeatRow {
  readonly label: string;
  /** One value per column, in `columns` order. */
  readonly values: readonly number[];
}

export function Heatmap({
  title,
  subtitle,
  columns,
  rows,
  format = "plain",
  valueLabel = "Value",
  labelEvery = 1,
  /** Normalise against this instead of the observed maximum. */
  scaleMax,
}: {
  title: string;
  subtitle?: string;
  columns: readonly string[];
  rows: readonly HeatRow[];
  format?: NumberFormat;
  valueLabel?: string;
  labelEvery?: number;
  scaleMax?: number;
}) {
  const { wrapRef, show, hide, tipNode } = useTooltip();
  // Tokens cross the server/client boundary; the formatter is built here.
  const fmt = (value: number) => formatNumber(format, value);
  const max = scaleMax ?? Math.max(1, ...rows.flatMap((r) => r.values));

  const table: TableView = {
    columns: ["Row", ...columns],
    rows: rows.map((r) => [r.label, ...r.values.map((v) => fmt(v))]),
  };

  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      table={table}
      action={
        <div className="flex items-center gap-2 text-[11px] text-mist">
          <span>low</span>
          <span className="flex gap-[2px]" aria-hidden>
            {SEQUENTIAL.map((hex) => (
              <span
                key={hex}
 className="inline-block size-3"
                style={{ background: hex }}
              />
            ))}
          </span>
          <span>high</span>
        </div>
      }
    >
      <div ref={wrapRef} className="relative" onMouseLeave={hide}>
        <div className="table-scroll">
          <table className="w-full border-separate border-spacing-0">
            <caption className="sr-only">
              {title} — a magnitude grid. Exact values are in the table view below.
            </caption>
            <thead>
              <tr>
                <th className="w-[1%] whitespace-nowrap pr-3" />
                {columns.map((column, i) => (
                  <th
                    key={column}
 scope="col"
 className="px-0 pb-1.5 text-center text-[10px] font-normal text-mist"
                  >
                    {i % labelEvery === 0 ? column : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th
 scope="row"
 className="max-w-[190px] truncate pr-3 text-left text-[12px] font-normal text-fog"
                  >
                    {row.label}
                  </th>
                  {row.values.map((value, c) => (
                    <td
                      key={`${row.label}-${c}`}
                      // The full 2px surface gap on every side. At 1px,
                      // consecutive active days merged into one continuous bar
                      // and the grid read as a Gantt chart rather than a
                      // magnitude map — the separation has to be visible at the
                      // cell size the chart actually renders at.
 className="p-[2px]"
                      style={{ height: MARK.minHitTarget }}
                      onMouseMove={(e) =>
                        show(
                          e,
                          <TipBody
                            title={row.label}
                            rows={[
                              { label: columns[c] ?? "", value: fmt(value) },
                              { label: valueLabel, value: fmt(value) },
                            ].slice(0, value === 0 ? 1 : 2)}
                          />,
                        )
                      }
                    >
                      <div
 className="h-5 w-full"
                        style={{
                          background:
                            value <= 0
                              ? "rgba(223,228,234,0.04)"
                              : sequentialStep(value / max),
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tipNode}
      </div>
    </ChartFrame>
  );
}
