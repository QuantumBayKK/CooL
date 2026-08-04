/**
 * The visual vocabulary, in one place.
 *
 * Charts here are hand-built SVG rather than a charting library, so these
 * constants are the contract between them. Anything that needs a colour asks
 * this module by ROLE — `SERIES[2]`, `severityToken("high")` — never by hex, so
 * a palette change is one edit and cannot drift between two charts that are
 * supposed to agree.
 *
 * ## The palette was computed, not chosen
 *
 * Every value below was validated against this app's actual chart surface
 * (`#161b22`) in dark mode, on five checks: OKLCH lightness band, chroma floor,
 * contrast against the surface, colour-vision-deficiency separation under
 * simulated protanopia and deuteranopia, and a normal-vision separation floor.
 *
 *   categorical, worst adjacent pair : ΔE 13.0 (CVD) · 15.8 (normal vision)
 *   sequential ramp                  : monotone L, ≥0.06 per step, low end 2.68:1
 *
 * ## The three-slot cap
 *
 * Bars, stacked bars and lines only ever place *adjacent* slots beside each
 * other, so the five-slot order is safe there. Scatter plots and heatmaps can
 * put any two marks side by side, and past three slots the violet/blue pair
 * collapses under protanopia (ΔE 3.3). Those forms therefore cap at three
 * series and fold the rest into "Other" — see {@link ALL_PAIRS_SERIES_CAP}.
 * That is a real constraint on the charts, not a note.
 */

/* ── surfaces and ink ─────────────────────────────────────────────────── */

export const SURFACE = {
  page: "#101317",
  panel: "#16191e",
  raised: "#1c2027",
  line: "rgba(223,228,234,0.10)",
  lineStrong: "rgba(223,228,234,0.20)",
} as const;

export const INK = {
  primary: "#dfe4ea",
  secondary: "#a9b2bd",
  muted: "#848e9b",
} as const;

/* ── categorical series ───────────────────────────────────────────────── */

/** Fixed order. Assigned in sequence, never cycled. */
export const SERIES = ["#388bfd", "#db6d28", "#0aa08d", "#a371f7", "#db61a2"] as const;

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
export const SEQUENTIAL = ["#265ea8", "#2f81f7", "#58a6ff", "#8fcaff", "#c9e2ff"] as const;

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
    hex: "#4cc26a",
    glyph: "✓",
    text: "text-live",
    border: "border-live/40",
    bg: "bg-live/[0.10]",
    dot: "bg-live",
  },
  info: {
    hex: "#6cb0ff",
    glyph: "•",
    text: "text-verify",
    border: "border-verify/40",
    bg: "bg-verify/[0.10]",
    dot: "bg-verify",
  },
  serious: {
    hex: "#d8a530",
    glyph: "▲",
    text: "text-warn",
    border: "border-warn/45",
    bg: "bg-warn/[0.10]",
    dot: "bg-warn",
  },
  critical: {
    hex: "#f2726b",
    glyph: "✕",
    text: "text-fail",
    border: "border-fail/50",
    bg: "bg-fail/[0.10]",
    dot: "bg-fail",
  },
  absent: {
    hex: "#848e9b",
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
