"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { BAND_STYLE, type RiskBand } from "@/lib/dashboard/risk";

/** Shared furniture for the console: tiles, badges, bars, panels. */

export function Panel({
  title,
  hint,
  action,
  children,
  className,
}: {
  title?: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("frost rounded-2xl border border-line p-4 sm:p-5", className)}>
      {title ? (
        <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="font-mono text-[12px] tracking-[0.14em] text-verify uppercase">
              {title}
            </h3>
            {hint ? <p className="mt-1 text-[12.5px] text-mist">{hint}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Kpi({
  value,
  label,
  sub,
  tone = "ink",
}: {
  value: string;
  label: string;
  sub?: string;
  tone?: "ink" | "live" | "verify" | "warn" | "fail";
}) {
  const toneClass = {
    ink: "text-ink",
    live: "text-live",
    verify: "text-verify",
    warn: "text-[#d29922]",
    fail: "text-fail",
  }[tone];
  return (
    <div className="frost rounded-xl border border-line px-4 py-3.5">
      <p className={clsx("display text-[clamp(1.6rem,5vw,2.1rem)] leading-none", toneClass)}>
        {value}
      </p>
      <p className="mt-1.5 font-mono text-[11px] tracking-[0.1em] text-mist uppercase">
        {label}
      </p>
      {sub ? <p className="mt-1 text-[12px] leading-snug text-fog">{sub}</p> : null}
    </div>
  );
}

export function RiskBadge({ band, probability }: { band: RiskBand; probability?: number }) {
  const s = BAND_STYLE[band];
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] uppercase",
        s.border,
        s.bg,
        s.text,
      )}
    >
      <span className={clsx("size-1.5 rounded-full", s.dot)} />
      {s.label}
      {probability !== undefined ? ` ${Math.round(probability * 100)}%` : ""}
    </span>
  );
}

/** A thin labelled progress bar. */
export function Meter({
  value,
  tone = "verify",
  className,
}: {
  value: number;
  tone?: "verify" | "live" | "warn" | "fail";
  className?: string;
}) {
  const bar = {
    verify: "bg-verify",
    live: "bg-live",
    warn: "bg-[#d29922]",
    fail: "bg-fail",
  }[tone];
  return (
    <span className={clsx("block h-1.5 overflow-hidden rounded-full bg-faint", className)}>
      <motion.span
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={clsx("block h-full rounded-full", bar)}
      />
    </span>
  );
}

/** Activity sparkline — pure SVG, no chart library. */
export function Sparkline({
  data,
  className,
}: {
  data: readonly number[];
  className?: string;
}) {
  const max = Math.max(1, ...data);
  const w = 100;
  const h = 28;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const pts = data.map((v, i) => `${(i * step).toFixed(2)},${(h - (v / max) * h).toFixed(2)}`);
  const line = `M ${pts.join(" L ")}`;
  const area = `${line} L ${w},${h} L 0,${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={clsx("h-8 w-full", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(88,166,255)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(88,166,255)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path
        d={line}
        fill="none"
        stroke="rgb(88,166,255)"
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const EVIDENCE_STYLE = {
  sealed: { text: "text-live", label: "Sealed", glyph: "✓" },
  sealing: { text: "text-verify", label: "Sealing", glyph: "◍" },
  unattested: { text: "text-[#d29922]", label: "Unattested", glyph: "⚠" },
} as const;

export function EvidenceChip({ state }: { state: keyof typeof EVIDENCE_STYLE }) {
  const s = EVIDENCE_STYLE[state];
  return (
    <span className={clsx("font-mono text-[11px] whitespace-nowrap", s.text)}>
      {s.glyph} {s.label}
    </span>
  );
}

const APPROVAL_STYLE = {
  approved: { text: "text-live", label: "Approved" },
  pending: { text: "text-verify", label: "Pending" },
  overdue: { text: "text-fail", label: "Overdue" },
  "not-required": { text: "text-mist", label: "Not required" },
} as const;

export function ApprovalChip({ state }: { state: keyof typeof APPROVAL_STYLE }) {
  const s = APPROVAL_STYLE[state];
  return (
    <span className={clsx("font-mono text-[11px] whitespace-nowrap", s.text)}>{s.label}</span>
  );
}
