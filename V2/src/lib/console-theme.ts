/**
 * The visual vocabulary, in one place.
 *
 * Charts here are hand-built SVG rather than a charting library, so these
 * constants are the contract between them. Anything that needs a colour asks
 * this module by ROLE — `SERIES[2]`, `severityToken("high")` — never by hex, so
 * a palette change is one edit and cannot drift between two charts that are
 * supposed to agree.
 *
 * ## Nothing here is a literal any more
 *
 * Every value below is a CSS custom property rather than a hex string. That is
 * what lets these charts render in both themes from one set of markup: the
 * theme flip re-resolves `var(--s2)` and the SVG repaints, with no second
 * palette, no JS colour-mode branch, and no chance of the two drifting.
 *
 * The literals live in `app/globals.css`, which is also where the measurements
 * that justify them are recorded.
 *
 * ## The palette was computed, not chosen
 *
 * Both theme sets were validated against the real chart surface — `#FFFFFF`
 * light, `#101012` dark — on five checks: OKLCH lightness band, chroma floor,
 * contrast against the surface, CVD separation under simulated protanopia,
 * deuteranopia and tritanopia, and a normal-vision separation floor.
 *
 *   light, worst adjacent pair : ΔE 13.8 (CVD) · 26.4 (normal vision)
 *   dark,  worst adjacent pair : ΔE 12.5 (CVD) · 19.2 (normal vision)
 *
 * ## The three-slot cap
 *
 * Bars, stacked bars and lines only ever place *adjacent* slots beside each
 * other, so the five-slot order is safe there. Scatter plots and heatmaps can
 * put any two marks side by side; those forms validate on all-pairs rather than
 * adjacent pairs, and past three slots the pairs collapse. They therefore cap
 * at three series and fold the rest into "Other" — see
 * {@link ALL_PAIRS_SERIES_CAP}. That is a real constraint on the charts, not a
 * note.
 */

/* ── surfaces and ink ─────────────────────────────────────────────────── */

export const SURFACE = {
  page: "var(--canvas)",
  panel: "var(--surface)",
  raised: "var(--raised)",
  line: "var(--line)",
  lineStrong: "var(--line-strong)",
} as const;

export const INK = {
  primary: "var(--ink)",
  secondary: "var(--ink-muted)",
  muted: "var(--ink-subtle)",
} as const;

/* ── categorical series ───────────────────────────────────────────────── */

/** Fixed order. Assigned in sequence, never cycled. */
export const SERIES = [
  "var(--s1)",
  "var(--s2)",
  "var(--s3)",
  "var(--s4)",
  "var(--s5)",
] as const;

/** Human names, for legends and the table view. */
export const SERIES_NAME = ["blue", "orange", "teal", "violet", "magenta"] as const;

/**
 * How many series a chart may carry when any two marks can be neighbours
 * (scatter, bubble, heatmap). Bars/lines/stacks use the full {@link SERIES}.
 */
export const ALL_PAIRS_SERIES_CAP = 3;

/** Slot `i`, clamped. A 6th series is a design error, not a generated hue. */
export function seriesColor(index: number): string {
  return SERIES[Math.min(Math.max(index, 0), SERIES.length - 1)]!;
}

/* ── sequential ramp (magnitude) ──────────────────────────────────────── */

/** One hue, low → high. */
export const SEQUENTIAL = [
  "var(--seq-1)",
  "var(--seq-2)",
  "var(--seq-3)",
  "var(--seq-4)",
  "var(--seq-5)",
] as const;

/**
 * Map a 0…1 magnitude onto the ramp.
 * Values are bucketed rather than interpolated so a reader can match a cell to
 * a legend swatch exactly — a continuous gradient looks richer and cannot be
 * read back to a number.
 */
export function sequentialStep(value01: number): string {
  const clamped = value01 < 0 ? 0 : value01 > 1 ? 1 : value01;
  const index = Math.min(SEQUENTIAL.length - 1, Math.floor(clamped * SEQUENTIAL.length));
  return SEQUENTIAL[index]!;
}

/* ── status ───────────────────────────────────────────────────────────── */

/**
 * Reserved meanings. A status colour is never reused as "series 4", and it
 * never appears without a glyph and a written label — which is why every token
 * below carries both.
 */
export type StatusRole = "good" | "info" | "serious" | "critical" | "absent";

export interface StatusToken {
  readonly hex: string;
  /** Carries the meaning when colour cannot — CVD, print, forced-colors. */
  readonly glyph: string;
  readonly text: string;
  readonly border: string;
  readonly bg: string;
  readonly dot: string;
}

export const STATUS: Record<StatusRole, StatusToken> = {
  good: {
    hex: "var(--ok)",
    glyph: "✓",
    text: "text-live",
    border: "border-live/40",
    bg: "bg-live/[0.10]",
    dot: "bg-live",
  },
  info: {
    hex: "var(--accent)",
    glyph: "•",
    text: "text-verify",
    border: "border-verify/40",
    bg: "bg-verify/[0.10]",
    dot: "bg-verify",
  },
  serious: {
    hex: "var(--warn)",
    glyph: "▲",
    text: "text-warn",
    border: "border-warn/45",
    bg: "bg-warn/[0.10]",
    dot: "bg-warn",
  },
  critical: {
    hex: "var(--fail)",
    glyph: "✕",
    text: "text-fail",
    border: "border-fail/50",
    bg: "bg-fail/[0.10]",
    dot: "bg-fail",
  },
  absent: {
    hex: "var(--ink-subtle)",
    glyph: "·",
    text: "text-mist",
    border: "border-line-strong",
    bg: "bg-faint",
    dot: "bg-mist",
  },
};

/* ── severity, which is ordinal rather than categorical ───────────────── */

export type Severity = "low" | "elevated" | "high" | "critical";

/**
 * Risk bands escalate, so they wear status tokens rather than series hues.
 * Green → blue → amber → red reads as "fine / noted / serious / act now", and
 * every use pairs the colour with the band's written label.
 */
export const SEVERITY_ROLE: Record<Severity, StatusRole> = {
  low: "good",
  elevated: "info",
  high: "serious",
  critical: "critical",
};

export const severityToken = (band: Severity): StatusToken => STATUS[SEVERITY_ROLE[band]];

export const SEVERITY_LABEL: Record<Severity, string> = {
  low: "Low",
  elevated: "Elevated",
  high: "High",
  critical: "Critical",
};

/** Worst-first, for legends and sort orders. */
export const SEVERITY_ORDER: readonly Severity[] = ["critical", "high", "elevated", "low"];
