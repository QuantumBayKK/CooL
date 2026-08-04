"use client";

/**
 * Demo primitives.
 *
 * Separate from `studio/ui` on purpose. Those are Atlassian-shaped, in a light
 * palette, because the studio is imitating a console a buyer already uses. The
 * demo is a dark room with one thing lit at a time, and it runs on the site's
 * own tokens.
 *
 * The rule these encode: status is never carried by colour alone. Every tone
 * ships a glyph, because the person being shown this may be looking at a
 * projector, a compressed video call, or with a colour vision deficiency — and
 * "is it green?" is the only question the whole demo is asking.
 */
import type { CSSProperties, ReactNode } from "react";

export type Tone = "live" | "verify" | "warn" | "fail" | "mock";

const TONE: Record<Tone, { fg: string; bg: string; glyph: string }> = {
  live: { fg: "var(--color-live)", bg: "rgba(63,185,80,0.12)", glyph: "✓" },
  verify: { fg: "var(--color-verify)", bg: "rgba(88,166,255,0.12)", glyph: "•" },
  warn: { fg: "var(--color-warn)", bg: "rgba(210,153,34,0.14)", glyph: "▲" },
  fail: { fg: "var(--color-fail)", bg: "rgba(248,81,73,0.13)", glyph: "✕" },
  mock: { fg: "var(--color-mock)", bg: "rgba(139,148,158,0.12)", glyph: "·" },
};

/** Map a verifier domain status onto a tone. The verifier's word is final. */
export function toneOf(status: string): Tone {
  if (status === "pass") return "live";
  if (status === "fail") return "fail";
  if (status === "pending") return "warn";
  if (status === "simulated") return "verify";
  return "mock";
}

export function Pill({
  children,
  tone = "mock",
  glyph = true,
}: {
  children: ReactNode;
  tone?: Tone;
  glyph?: boolean;
}) {
  const t = TONE[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] font-mono text-[10.5px] font-medium tracking-[0.04em] uppercase"
      style={{ color: t.fg, background: t.bg }}
    >
      {glyph && <span aria-hidden>{t.glyph}</span>}
      {children}
    </span>
  );
}

export function Dot({ tone = "mock", pulse = false }: { tone?: Tone; pulse?: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-[7px] shrink-0 rounded-full ${pulse ? "story-pulse" : ""}`}
      style={{ background: TONE[tone].fg }}
    />
  );
}

/** A panel. One hairline, one surface, no gradients — the content is the design. */
export function Panel({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-lg border border-line bg-panel ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

/** A key/value line. Values monospace by default — most of them are digests. */
export function Field({
  k,
  v,
  mono = true,
  tone,
}: {
  k: string;
  v: ReactNode;
  mono?: boolean;
  tone?: Tone;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-[3px]">
      <span className="shrink-0 text-[11.5px] text-mist">{k}</span>
      <span
        className={`min-w-0 truncate text-right text-[11.5px] ${mono ? "font-mono" : ""}`}
        style={{ color: tone ? TONE[tone].fg : "var(--color-fog)" }}
        title={typeof v === "string" ? v : undefined}
      >
        {v}
      </span>
    </div>
  );
}

/** Section heading: small, spaced, quiet. */
export function Label({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[10.5px] tracking-[0.16em] text-mist uppercase">
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  tone = "default",
  disabled = false,
  size = "md",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "default" | "primary" | "ghost" | "danger";
  disabled?: boolean;
  size?: "sm" | "md";
  title?: string;
}) {
  const styles: Record<string, CSSProperties> = {
    primary: { background: "var(--color-verify)", color: "#06121f", borderColor: "transparent" },
    default: {
      background: "var(--color-raised)",
      color: "var(--color-ink)",
      borderColor: "var(--color-line-strong)",
    },
    ghost: { background: "transparent", color: "var(--color-mist)", borderColor: "var(--color-line)" },
    danger: { background: "transparent", color: "var(--color-fail)", borderColor: "rgba(248,81,73,0.4)" },
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border font-medium transition-[filter,transform,opacity] hover:brightness-110 active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-40 ${
        size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3.5 py-1.5 text-[13px]"
      }`}
      style={styles[tone]}
    >
      {children}
    </button>
  );
}

/** Truncated digest with the full value on hover and a copy affordance. */
export function Digest({ value, chars = 14 }: { value: string; chars?: number }) {
  const raw = value.split(":").pop() ?? value;
  const short = raw.length <= chars ? raw : `${raw.slice(0, chars)}…`;
  return (
    <button
      type="button"
      title={`${value} — click to copy`}
      onClick={() => void navigator.clipboard?.writeText(value)}
      className="font-mono text-[11.5px] text-fog transition-colors hover:text-verify"
    >
      {short}
    </button>
  );
}

/** `11:21:18 UTC` — the demo shows wall-clock, because the story is about time. */
export function clockOf(at: number): string {
  return `${new Date(at).toISOString().slice(11, 19)} UTC`;
}

export function relativeOf(at: number, from = Date.now()): string {
  const seconds = Math.max(0, Math.round((from - at) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}
