"use client";

/**
 * Atlassian-flavoured primitives for the console.
 *
 * One file, because a console's credibility comes from repetition: every card
 * has the same 3px corner, every table the same 12px uppercase header, every
 * status the same lozenge. Componentising that here means a view can be written
 * in a hundred lines of layout and still look like it was designed, and it means
 * a palette change is one edit rather than forty.
 *
 * Every status token carries a glyph as well as a colour — the same rule the
 * deck's charts follow. Colour is the fast channel, not the only one.
 */
import type { CSSProperties, ReactNode } from "react";

/* ── surfaces ─────────────────────────────────────────────────────────── */

export function Card({
  children,
  className = "",
  padded = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  style?: CSSProperties;
}) {
  return (
    <section
      className={`rounded-[3px] border ${padded ? "p-4" : ""} ${className}`}
      style={{
        background: "var(--atl-surface)",
        borderColor: "var(--atl-border)",
        boxShadow: "var(--atl-shadow)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function CardHead({
  title,
  hint,
  right,
}: {
  title: string;
  hint?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--atl-text)" }}>
          {title}
        </h2>
        {hint && (
          <p className="mt-0.5 text-[12.5px] leading-snug" style={{ color: "var(--atl-muted)" }}>
            {hint}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-[11px] font-bold tracking-[0.08em] uppercase"
      style={{ color: "var(--atl-muted)" }}
    >
      {children}
    </p>
  );
}

/* ── status ───────────────────────────────────────────────────────────── */

export type Tone = "neutral" | "info" | "success" | "warn" | "danger" | "purple" | "teal";

const TONE: Record<Tone, { fg: string; bg: string; glyph: string }> = {
  neutral: { fg: "var(--atl-subtle)", bg: "var(--atl-grey-bg)", glyph: "·" },
  info: { fg: "var(--atl-blue)", bg: "var(--atl-blue-bg)", glyph: "•" },
  success: { fg: "var(--atl-green)", bg: "var(--atl-green-bg)", glyph: "✓" },
  warn: { fg: "var(--atl-yellow)", bg: "var(--atl-yellow-bg)", glyph: "▲" },
  danger: { fg: "var(--atl-red)", bg: "var(--atl-red-bg)", glyph: "✕" },
  purple: { fg: "var(--atl-purple)", bg: "var(--atl-purple-bg)", glyph: "◆" },
  teal: { fg: "var(--atl-teal)", bg: "var(--atl-teal-bg)", glyph: "◐" },
};

/** Atlassian's status pill: small, bold, uppercase, and never colour alone. */
export function Lozenge({
  children,
  tone = "neutral",
  glyph = false,
}: {
  children: ReactNode;
  tone?: Tone;
  glyph?: boolean;
}) {
  const t = TONE[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-[3px] px-1.5 py-[1px] text-[11px] font-bold tracking-[0.03em] uppercase"
      style={{ color: t.fg, background: t.bg }}
    >
      {glyph && <span aria-hidden>{t.glyph}</span>}
      {children}
    </span>
  );
}

export function Dot({ tone = "neutral" }: { tone?: Tone }) {
  return (
    <span
      aria-hidden
      className="inline-block size-2 shrink-0 rounded-full"
      style={{ background: TONE[tone].fg }}
    />
  );
}

/* ── controls ─────────────────────────────────────────────────────────── */

type BtnVariant = "primary" | "default" | "subtle" | "danger" | "link";

const BTN: Record<BtnVariant, CSSProperties> = {
  primary: { background: "var(--atl-blue)", color: "#fff", borderColor: "transparent" },
  default: {
    background: "var(--atl-raised)",
    color: "var(--atl-text)",
    borderColor: "var(--atl-border)",
  },
  subtle: { background: "transparent", color: "var(--atl-subtle)", borderColor: "transparent" },
  danger: { background: "var(--atl-red-bold)", color: "#fff", borderColor: "transparent" },
  link: { background: "transparent", color: "var(--atl-blue)", borderColor: "transparent" },
};

export function Btn({
  children,
  onClick,
  variant = "default",
  disabled = false,
  size = "md",
  title,
  full = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  size?: "sm" | "md";
  title?: string;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-1.5 rounded-[3px] border font-medium shadow-[0_1px_0_rgba(9,30,66,0.08)] transition-[filter,box-shadow,transform] hover:brightness-[0.97] hover:shadow-[0_2px_4px_rgba(9,30,66,0.16)] active:translate-y-[0.5px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${
        size === "sm" ? "px-2 py-1 text-[12px]" : "px-3 py-1.5 text-[13.5px]"
      } ${full ? "w-full" : ""}`}
      style={BTN[variant]}
    >
      {children}
    </button>
  );
}

export function Toggle({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="inline-flex rounded-[3px] border p-[2px]"
      style={{ borderColor: "var(--atl-border)", background: "var(--atl-raised)" }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className="rounded-[2px] px-2.5 py-1 text-[12.5px] font-medium transition-colors"
            style={{
              background: active ? "var(--atl-surface)" : "transparent",
              color: active ? "var(--atl-text)" : "var(--atl-muted)",
              boxShadow: active ? "var(--atl-shadow)" : "none",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function TextArea({
  value,
  onChange,
  rows = 4,
  mono = false,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  mono?: boolean;
  placeholder?: string;
  label?: string;
}) {
  return (
    <label className="block">
      {label && (
        <span
          className="mb-1 block text-[12px] font-semibold"
          style={{ color: "var(--atl-subtle)" }}
        >
          {label}
        </span>
      )}
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`thin-scroll w-full resize-y rounded-[3px] border px-2.5 py-2 text-[13px] leading-relaxed outline-none ${
          mono ? "font-mono text-[12px]" : ""
        }`}
        style={{
          background: "var(--atl-surface)",
          borderColor: "var(--atl-border-strong)",
          color: "var(--atl-text)",
        }}
      />
    </label>
  );
}

export function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  label?: string;
}) {
  return (
    <label className="block">
      {label && (
        <span
          className="mb-1 block text-[12px] font-semibold"
          style={{ color: "var(--atl-subtle)" }}
        >
          {label}
        </span>
      )}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[3px] border px-2 py-1.5 text-[13px] outline-none"
        style={{
          background: "var(--atl-surface)",
          borderColor: "var(--atl-border-strong)",
          color: "var(--atl-text)",
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ── data display ─────────────────────────────────────────────────────── */

export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <Card padded={false} className="p-3.5">
      <p
        className="text-[11px] font-bold tracking-[0.07em] uppercase"
        style={{ color: "var(--atl-muted)" }}
      >
        {label}
      </p>
      <p
        className="mt-1.5 text-[26px] leading-none font-semibold tabular-nums"
        style={{ color: tone === "neutral" ? "var(--atl-text)" : TONE[tone].fg }}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1.5 text-[12px] leading-snug" style={{ color: "var(--atl-muted)" }}>
          {hint}
        </p>
      )}
    </Card>
  );
}

export function Table({ children, head }: { children: ReactNode; head: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr
            className="text-left text-[11px] font-bold tracking-[0.07em] uppercase"
            style={{ color: "var(--atl-muted)" }}
          >
            {head}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, width }: { children: ReactNode; width?: string }) {
  return (
    <th
      className="border-b px-2.5 py-2 font-bold whitespace-nowrap"
      style={{ borderColor: "var(--atl-border)", width }}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  mono = false,
  nowrap = false,
}: {
  children: ReactNode;
  mono?: boolean;
  nowrap?: boolean;
}) {
  return (
    <td
      className={`border-b px-2.5 py-2 align-middle ${mono ? "font-mono text-[12px]" : ""} ${
        nowrap ? "whitespace-nowrap" : ""
      }`}
      style={{ borderColor: "var(--atl-border)", color: "var(--atl-text)" }}
    >
      {children}
    </td>
  );
}

export function Row({
  children,
  onClick,
  active = false,
  flash = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  flash?: boolean;
}) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors ${onClick ? "cursor-pointer" : ""} ${flash ? "studio-flash" : ""}`}
      style={active ? { background: "var(--atl-blue-bg)" } : undefined}
      onMouseEnter={(event) => {
        if (!active) event.currentTarget.style.background = "var(--atl-raised)";
      }}
      onMouseLeave={(event) => {
        if (!active) event.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </tr>
  );
}

/** A hash, shortened, in monospace, with the full value on hover and on copy. */
export function Hash({ value, chars = 10 }: { value: string; chars?: number }) {
  const body = value.includes(":") ? value.slice(value.lastIndexOf(":") + 1) : value;
  return (
    <button
      type="button"
      title={`${value}\n(click to copy)`}
      onClick={() => void navigator.clipboard?.writeText(value)}
      className="cursor-pointer font-mono text-[12px] hover:underline"
      style={{ color: "var(--atl-subtle)" }}
    >
      {body.slice(0, chars)}…
    </button>
  );
}

export function KeyValue({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-[3px]">
      <span className="shrink-0 text-[12.5px]" style={{ color: "var(--atl-muted)" }}>
        {k}
      </span>
      <span className="text-right text-[12.5px]" style={{ color: "var(--atl-text)" }}>
        {v}
      </span>
    </div>
  );
}

export function Meter({ value, tone = "info" }: { value: number; tone?: Tone }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-[2px]"
      style={{ background: "var(--atl-sunken)" }}
    >
      <div
        className="h-full rounded-[2px] transition-[width] duration-500"
        style={{ width: `${pct}%`, background: TONE[tone].fg }}
      />
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-[3px] border border-dashed px-4 py-8 text-center text-[13px]"
      style={{ borderColor: "var(--atl-border-strong)", color: "var(--atl-muted)" }}
    >
      {children}
    </div>
  );
}

/** A block of JSON, scrollable, with a copy control. */
export function Json({ value, maxHeight = 320 }: { value: unknown; maxHeight?: number }) {
  const text = JSON.stringify(value, null, 2);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void navigator.clipboard?.writeText(text)}
        className="absolute top-2 right-2 z-10 rounded-[3px] border px-1.5 py-0.5 text-[11px] font-semibold"
        style={{
          background: "var(--atl-surface)",
          borderColor: "var(--atl-border)",
          color: "var(--atl-subtle)",
        }}
      >
        Copy
      </button>
      <pre
        className="thin-scroll overflow-auto rounded-[3px] border p-3 font-mono text-[11.5px] leading-[1.55]"
        style={{
          background: "var(--atl-sunken)",
          borderColor: "var(--atl-border)",
          color: "var(--atl-subtle)",
          maxHeight,
        }}
      >
        {text}
      </pre>
    </div>
  );
}

/* ── formatting ───────────────────────────────────────────────────────── */

export function relativeTime(at: number): string {
  const seconds = Math.max(1, Math.round((Date.now() - at) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function clockTime(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Initials avatar, Atlassian-style — flat, square-ish, no photo. */
export function Avatar({ id, size = 24 }: { id: string; size?: number }) {
  const handle = id.includes(":") ? id.slice(id.indexOf(":") + 1) : id;
  const initials = handle
    .replace(/[@.].*$/, "")
    .split(/[-_ ]/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const palette = ["#5e4db2", "#206a83", "#216e4e", "#a54800", "#ae2e24", "#1868db"];
  let hash = 0;
  for (let i = 0; i < handle.length; i++) hash = (hash * 31 + handle.charCodeAt(i)) >>> 0;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: palette[hash % palette.length],
      }}
      title={id}
    >
      {initials || "?"}
    </span>
  );
}
