/**
 * Formatting for the console surface.
 *
 * Every function here is a pure function of its arguments — no `Date.now()`,
 * no locale sniffing. The console renders on the server and hydrates in the
 * browser, and a number that changes shape between those two renders is both a
 * React error and a credibility problem on a page whose whole pitch is that
 * the numbers are trustworthy.
 */
import { ESTATE_NOW } from "./dashboard/estate";

const GROUPED = new Intl.NumberFormat("en-US");

/** 1234567 → "1,234,567". */
export const num = (n: number): string => GROUPED.format(Math.round(n));

/** Compact magnitude for axis ticks and dense tiles: 4180000 → "4.2M". */
export function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${trim(n / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${trim(n / 1_000_000)}M`;
  if (abs >= 1_000) return `${trim(n / 1_000)}k`;
  return String(Math.round(n));
}

const trim = (n: number): string => {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

/** 0.4271 → "43%". */
export const pct = (fraction: number, digits = 0): string =>
  `${(fraction * 100).toFixed(digits)}%`;

/** 1275 minutes → "21h 15m". */
export function minutes(total: number): string {
  const m = Math.round(total);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h < 24) return rem ? `${h}h ${rem}m` : `${h}h`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

/** Minutes → whole working days, for "this is how much time you got back". */
export const workDays = (mins: number): number => Math.round((mins / 60 / 8) * 10) / 10;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "12 Jun" — short, unambiguous, identical on server and client. */
export const shortDate = (date: Date): string =>
  `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;

/** "12 Jun 2026, 14:05 UTC" for detail views. */
export function fullDate(date: Date): string {
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${hh}:${mm} UTC`;
}

/**
 * Relative time against the estate's fixed clock, never the wall clock.
 * That is what keeps "4m ago" identical in the server render and the hydrated
 * one; a real deployment swaps `ESTATE_NOW` for the request time.
 */
export function ago(date: Date, now: Date = ESTATE_NOW): string {
  const mins = Math.round((now.getTime() - date.getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days}d ago` : `${Math.round(days / 30)}mo ago`;
}

/* ── format tokens ────────────────────────────────────────────────────────
   Charts are client components; the pages that use them are server
   components, and React Server Components cannot pass a function across that
   boundary. So a chart takes the NAME of a format and resolves it on the
   client — which turns out to be the better API anyway, since the set of
   number formats a dashboard needs is small and worth naming.               */

export type NumberFormat = "plain" | "int" | "compact" | "decimal1" | "percent";

export function formatNumber(token: NumberFormat, value: number): string {
  switch (token) {
    case "int":
      return num(value);
    case "compact":
      return compact(value);
    case "decimal1":
      return value.toFixed(1);
    case "percent":
      return `${Math.round(value)}%`;
    case "plain":
      return String(Math.round(value * 100) / 100);
  }
}
