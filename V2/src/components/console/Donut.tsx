"use client";

/**
 * Part-to-whole, at a glance only.
 *
 * A donut earns its place when the question is "roughly what share" and there
 * are few segments — never when the reader has to compare two close values, and
 * never past six slices. The centre carries the total, which is the one thing a
 * pie cannot show and the reason to use a donut rather than a pie at all.
 *
 * Segments are separated by a gap in the surface colour, sized in degrees to
 * match the 2px spacer at this radius.
 */
import { ChartFrame, TipBody, useTooltip } from "./viz";
import { SURFACE } from "@/lib/console-theme";
import type { LegendItem, TableView } from "./viz";
import { formatNumber, type NumberFormat } from "@/lib/console-format";

export interface DonutSlice {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

const SIZE = 168;
const RADIUS = 68;
const THICKNESS = 18;

function arc(startAngle: number, endAngle: number): string {
  const c = SIZE / 2;
  const outer = RADIUS;
  const inner = RADIUS - THICKNESS;
  const toXY = (angle: number, r: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return [c + r * Math.cos(rad), c + r * Math.sin(rad)];
  };
  const [x1, y1] = toXY(startAngle, outer);
  const [x2, y2] = toXY(endAngle, outer);
  const [x3, y3] = toXY(endAngle, inner);
  const [x4, y4] = toXY(startAngle, inner);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M${x1},${y1}`,
    `A${outer},${outer} 0 ${large} 1 ${x2},${y2}`,
    `L${x3},${y3}`,
    `A${inner},${inner} 0 ${large} 0 ${x4},${y4}`,
    "Z",
  ].join(" ");
}

export function Donut({
  title,
  subtitle,
  slices,
  centreLabel,
  centreValue,
  format = "plain",
}: {
  title: string;
  subtitle?: string;
  slices: readonly DonutSlice[];
  centreLabel: string;
  centreValue: string;
  format?: NumberFormat;
}) {
  const { wrapRef, show, hide, tipNode } = useTooltip();
  // Tokens cross the server/client boundary; the formatter is built here.
  const fmt = (value: number) => formatNumber(format, value);
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;

  // 2px of arc at this radius, expressed in degrees.
  const GAP_DEG = (2 / RADIUS) * (180 / Math.PI);

  let cursor = 0;
  const rendered = slices
    .filter((s) => s.value > 0)
    .map((slice) => {
      const sweep = (slice.value / total) * 360;
      const start = cursor;
      cursor += sweep;
      return { slice, start, end: start + sweep };
    });

  const legend: LegendItem[] = slices.map((s) => ({
    label: s.label,
    color: s.color,
    value: fmt(s.value),
  }));

  const table: TableView = {
    columns: ["Segment", "Value", "Share"],
    rows: slices.map((s) => [
      s.label,
      fmt(s.value),
      `${((s.value / total) * 100).toFixed(1)}%`,
    ]),
  };

  return (
    <ChartFrame title={title} subtitle={subtitle} legend={legend} table={table}>
      <div ref={wrapRef} className="relative flex justify-center" onMouseLeave={hide}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
 role="img"
          aria-label={`${title}. Values are listed in the table view below.`}
        >
          {rendered.map(({ slice, start, end }) => (
            <path
              key={slice.label}
              d={arc(start, Math.max(start + 0.4, end - GAP_DEG))}
              fill={slice.color}
              onMouseMove={(e) =>
                show(
                  e,
                  <TipBody
                    title={slice.label}
                    rows={[
                      { label: "Value", value: fmt(slice.value), color: slice.color },
                      {
                        label: "Share",
                        value: `${((slice.value / total) * 100).toFixed(1)}%`,
                      },
                    ]}
                  />,
                )
              }
            />
          ))}
          {/* The centre is the reason this is a donut and not a pie. */}
          <text
            x={SIZE / 2}
            y={SIZE / 2 - 4}
 textAnchor="middle"
            fontSize={24}
            fontWeight={600}
 fill="#dfe4ea"
          >
            {centreValue}
          </text>
          <text
            x={SIZE / 2}
            y={SIZE / 2 + 15}
 textAnchor="middle"
            fontSize={11}
 fill="#848e9b"
          >
            {centreLabel}
          </text>
        </svg>
        {tipNode}
      </div>
    </ChartFrame>
  );
}

export const DONUT_GAP_COLOR = SURFACE.panel;
