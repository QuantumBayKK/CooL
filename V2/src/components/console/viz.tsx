"use client";

/**
 * Shared chart machinery.
 *
 * Charts here are hand-built SVG rather than a library, for two reasons: the
 * mark specs below are fixed and a library fights them, and a governance
 * console should not ship 90 KB of charting to draw eleven rectangles.
 *
 * Every chart in this app is assembled from these pieces, so the rules hold
 * once rather than per chart:
 *
 *   · a legend whenever there are two or more series — identity is never
 *     carried by colour alone;
 *   · a table view on every chart, so no value is reachable only by hovering;
 *   · hairline solid grid, one step off the surface, never dashed;
 *   · text in text tokens, never in the series colour (a light hue is
 *     illegible as text; the coloured swatch beside the label does the
 *     identifying);
 *   · a 2px surface gap between touching fills and a 2px surface ring on
 *     overlapping markers — separation by negative space, never by a stroke.
 */
import { useCallback, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { INK, SURFACE } from "@/lib/console-theme";

/* ── fixed mark specs ─────────────────────────────────────────────────── */

export const MARK = {
  /** Bars never fill their slot; the leftover band is air. */
  maxBarThickness: 24,
  /** at the data end, square at the baseline. */
  barRadius: 0,
  lineWidth: 2,
  /** Diameter ≥ 8px. */
  markerRadius: 4,
  /** Negative space does the separating. */
  surfaceGap: 2,
  surfaceRing: 2,
  areaOpacity: 0.1,
  /** Pointer targets are generous even when the mark is not. */
  minHitTarget: 24,
} as const;

export const AXIS_COLOR = "rgba(223,228,234,0.16)";
export const GRID_COLOR = "rgba(223,228,234,0.07)";

/* ── tooltip ──────────────────────────────────────────────────────────── */

export interface TipState {
  readonly x: number;
  readonly y: number;
  readonly content: ReactNode;
}

/**
 * Pointer-following tooltip anchored to a positioned wrapper.
 *
 * The tooltip is flipped to the left of the cursor near the right edge so it
 * never pushes the card into a horizontal scroll — a tooltip that causes the
 * layout to jump is worse than none.
 */
export function useTooltip() {
  const [tip, setTip] = useState<TipState | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const show = useCallback((event: { clientX: number; clientY: number }, content: ReactNode) => {
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return;
    setTip({ x: event.clientX - box.left, y: event.clientY - box.top, content });
  }, []);

  const hide = useCallback(() => setTip(null), []);

  const node =
    tip === null ? null : (
      <div
 className="viz-tip"
        style={{
          left: tip.x,
          top: tip.y,
          transform: `translate(${tip.x > (wrapRef.current?.clientWidth ?? 0) - 160 ? "calc(-100% - 12px)" : "12px"}, -50%)`,
        }}
 role="presentation"
      >
        {tip.content}
      </div>
    );

  return { wrapRef, show, hide, tipNode: node };
}

/** A tooltip body: a title line, then label/value rows. */
export function TipBody({
  title,
  rows,
}: {
  title: string;
  rows: readonly { label: string; value: string; color?: string }[];
}) {
  return (
    <>
      <div className="mb-1 font-medium text-ink">{title}</div>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          {row.color ? (
            <span
 className="inline-block size-2 shrink-0"
              style={{ background: row.color }}
            />
          ) : null}
          <span className="text-mist">{row.label}</span>
          <span className="ml-auto pl-3 tnum text-fog">{row.value}</span>
        </div>
      ))}
    </>
  );
}

/* ── legend ───────────────────────────────────────────────────────────── */

export interface LegendItem {
  readonly label: string;
  readonly color: string;
  readonly value?: string;
}

/** Always rendered for two or more series; omitted for one (the title names it). */
export function Legend({ items }: { items: readonly LegendItem[] }) {
  if (items.length < 2) return null;
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-[12px] text-mist">
          <span
            aria-hidden
 className="inline-block size-2.5 shrink-0"
            style={{ background: item.color }}
          />
          <span>{item.label}</span>
          {item.value ? <span className="tnum text-fog">{item.value}</span> : null}
        </li>
      ))}
    </ul>
  );
}

/* ── the table view every chart carries ───────────────────────────────── */

export interface TableView {
  readonly columns: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

/**
 * The WCAG-clean twin of the chart.
 *
 * Collapsed by default so it costs no space, but always present: a tooltip
 * enhances a chart, it never gates a value. This is also the relief channel
 * for anyone the palette does not serve.
 */
export function TableDisclosure({ table, caption }: { table: TableView; caption: string }) {
  return (
    <details className="group mt-3 no-print">
      <summary className="cursor-pointer list-none text-[12px] text-mist transition-colors hover:text-fog">
        <span className="inline-block transition-transform group-open:rotate-90">›</span>{" "}
        Table view
      </summary>
      <div className="table-scroll mt-2 border border-line">
        <table className="w-full text-[12px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-raised">
              {table.columns.map((column, i) => (
                <th
                  key={column}
 scope="col"
                  className={`px-3 py-1.5 font-medium text-mist ${i === 0 ? "text-left" : "text-right"}`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={r} className="border-t border-line">
                {row.map((cell, c) => (
                  <td
                    key={c}
                    className={`px-3 py-1.5 ${c === 0 ? "text-fog" : "tnum text-right text-mist"}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/* ── the frame every chart sits in ────────────────────────────────────── */

export function ChartFrame({
  title,
  subtitle,
  legend,
  table,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  legend?: readonly LegendItem[];
  table: TableView;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <figure className="m-0">
      <figcaption className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-[12px] text-mist">{subtitle}</p> : null}
        </div>
        {action}
      </figcaption>
      {legend && legend.length >= 2 ? (
        <div className="mb-3">
          <Legend items={legend} />
        </div>
      ) : null}
      {children}
      <TableDisclosure table={table} caption={`${title}${subtitle ? ` — ${subtitle}` : ""}`} />
    </figure>
  );
}

/* ── scales and ticks ─────────────────────────────────────────────────── */

/**
 * Round a maximum up to a clean axis bound.
 * Ticks land on 1/2/5 × 10ⁿ so they read as numbers a person would say out
 * loud, rather than 7 and 14 and 21.
 */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalised = value / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

/** `count + 1` evenly spaced tick values from 0 to `max`. */
export function ticks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (max / count) * i);
}

/* ── shared SVG bits ──────────────────────────────────────────────────── */

/** Horizontal gridlines: solid hairlines, one step off the surface. */
export function GridLines({
  values,
  scaleY,
  width,
  left,
}: {
  values: readonly number[];
  scaleY: (v: number) => number;
  width: number;
  left: number;
}) {
  return (
    <g aria-hidden>
      {values.map((value) => (
        <line
          key={value}
          x1={left}
          x2={width}
          y1={scaleY(value)}
          y2={scaleY(value)}
          stroke={value === 0 ? AXIS_COLOR : GRID_COLOR}
          strokeWidth={1}
 shapeRendering="crispEdges"
        />
      ))}
    </g>
  );
}

/** Y-axis tick labels, in muted ink with tabular figures so they align. */
export function YTicks({
  values,
  scaleY,
  format,
  left,
}: {
  values: readonly number[];
  scaleY: (v: number) => number;
  format: (v: number) => string;
  left: number;
}) {
  return (
    <g aria-hidden>
      {values.map((value) => (
        <text
          key={value}
          x={left - 8}
          y={scaleY(value)}
 textAnchor="end"
 dominantBaseline="middle"
          fontSize={10}
          fill={INK.muted}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {format(value)}
        </text>
      ))}
    </g>
  );
}

/**
 * A bar path: at the data end, square at the baseline.
 *
 * Rounding both ends would detach the bar from its baseline and make small
 * values look like floating pills; rounding only the tip keeps the mark
 * anchored to zero, which is the thing the reader measures against.
 */
export function barPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number = MARK.barRadius,
): string {
  const r = Math.min(radius, width / 2, Math.max(height, 0));
  if (height <= 0.5) return "";
  return [
    `M${x},${y + height}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${y + height}`,
    "Z",
  ].join(" ");
}

/** The horizontal mirror: at the right (data) end. */
export function barPathH(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number = MARK.barRadius,
): string {
  const r = Math.min(radius, height / 2, Math.max(width, 0));
  if (width <= 0.5) return "";
  return [
    `M${x},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${y + height - r}`,
    `Q${x + width},${y + height} ${x + width - r},${y + height}`,
    `L${x},${y + height}`,
    "Z",
  ].join(" ");
}

/** A smooth-enough polyline. Straight segments — no spline invention between points. */
export function linePath(points: readonly { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
}

/** A marker with the 2px surface ring that keeps it legible over a line. */
export function Marker({
  x,
  y,
  color,
  r = MARK.markerRadius,
}: {
  x: number;
  y: number;
  color: string;
  r?: number;
}) {
  return (
    <circle
      cx={x}
      cy={y}
      r={r}
      fill={color}
      stroke={SURFACE.panel}
      strokeWidth={MARK.surfaceRing}
    />
  );
}

/** Stable ids for gradients and clip paths inside a component instance. */
export function useVizId(prefix: string): string {
  const id = useId().replace(/:/g, "");
  return useMemo(() => `${prefix}-${id}`, [prefix, id]);
}
