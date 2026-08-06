import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The structural vocabulary of the site.
 *
 * Everything here is a layout or labelling primitive with no behaviour. They
 * exist so that vertical rhythm, hairline placement and label casing are
 * decided once rather than re-decided per page — which is the actual mechanism
 * behind "everything aligned".
 */

/* ── Section ──────────────────────────────────────────────────────────────── */

/**
 * A top-level band.
 *
 * `bordered` draws the hairline that separates it from the band above. It is
 * top-only by design: bottom borders double up with the next section's top
 * border and produce a 2px rule that looks like a rendering mistake.
 */
export function Section({
  className,
  bordered = true,
  tone = "canvas",
  children,
  ...props
}: ComponentProps<"section"> & {
  bordered?: boolean;
  tone?: "canvas" | "surface";
}) {
  return (
    <section
      className={cn(
        "section-y",
        tone === "surface" && "bg-surface",
        bordered && "border-t border-line",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("container-page", className)} {...props} />;
}

/* ── Eyebrow ──────────────────────────────────────────────────────────────── */

/**
 * The uppercase section marker.
 *
 * This is what does the work an oversized heading would otherwise do: it tells
 * the reader where they are without spending 96px of vertical space to say it.
 * The leading rule is what ties it to the grid.
 */
export function Eyebrow({
  className,
  rule = true,
  children,
  ...props
}: ComponentProps<"p"> & { rule?: boolean }) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-label uppercase text-ink-subtle",
        className,
      )}
      {...props}
    >
      {rule && <span aria-hidden className="h-px w-6 bg-line-strong" />}
      {children}
    </p>
  );
}

/* ── SectionHeader ────────────────────────────────────────────────────────── */

/**
 * Eyebrow + heading + one paragraph of lead. Capped at `--container-prose`
 * because a 1200px-wide paragraph is unreadable regardless of how good the copy
 * is.
 */
export function SectionHeader({
  eyebrow,
  title,
  lead,
  align = "start",
  className,
  as: Heading = "h2",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  align?: "start" | "center";
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && <Eyebrow rule={align !== "center"}>{eyebrow}</Eyebrow>}
      <Heading
        className={cn(
          Heading === "h1" ? "text-display" : "text-h2",
          "max-w-[20ch] sm:max-w-[24ch]",
          align === "center" && "mx-auto",
        )}
      >
        {title}
      </Heading>
      {lead && (
        <p className="max-w-prose text-lead text-ink-muted">{lead}</p>
      )}
    </div>
  );
}

/* ── Card ─────────────────────────────────────────────────────────────────── */

/**
 * Bordered, never raised. Shadows in this system are reserved for things that
 * genuinely float above the page (menus, modals); a shadowed card on a white
 * canvas is the single most reliable way to make enterprise software look like
 * a consumer app.
 */
export function Card({
  className,
  interactive = false,
  ...props
}: ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "border border-line bg-canvas",
        interactive &&
          "transition-colors duration-[--duration-state] ease-[--ease-out] hover:border-line-strong hover:bg-surface",
        className,
      )}
      {...props}
    />
  );
}

/* ── Status ───────────────────────────────────────────────────────────────── */

export type Status = "ok" | "warn" | "fail" | "neutral" | "accent";

const STATUS_STYLE: Record<Status, string> = {
  ok: "border-ok/25 bg-ok-wash text-ok",
  warn: "border-warn/25 bg-warn-wash text-warn",
  fail: "border-fail/25 bg-fail-wash text-fail",
  neutral: "border-line bg-raised text-ink-muted",
  accent: "border-accent/25 bg-accent-wash text-accent",
};

/**
 * A status chip.
 *
 * `glyph` is not decoration. Colour alone cannot carry pass/fail for a reader
 * with a colour-vision deficiency, and this site's whole subject is the
 * difference between verified and not — so the mark is redundant on purpose.
 */
export function StatusBadge({
  status,
  glyph = true,
  className,
  children,
  ...props
}: ComponentProps<"span"> & { status: Status; glyph?: boolean }) {
  const mark: Record<Status, string> = {
    ok: "✓",
    warn: "!",
    fail: "✕",
    neutral: "·",
    accent: "→",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5",
        "rounded-[--radius-xs] font-mono text-[0.6875rem] uppercase tracking-[0.06em]",
        STATUS_STYLE[status],
        className,
      )}
      {...props}
    >
      {glyph && <span aria-hidden>{mark[status]}</span>}
      {children}
    </span>
  );
}

/* ── Data list ────────────────────────────────────────────────────────────── */

/**
 * Label/value rows separated by hairlines. This is the shape most of the
 * technical content on the site takes, so it is a component rather than an
 * ad-hoc `<dl>` repeated eleven times with slightly different padding.
 */
export function DataList({
  rows,
  className,
}: {
  rows: readonly { label: ReactNode; value: ReactNode }[];
  className?: string;
}) {
  return (
    <dl className={cn("border-t border-line", className)}>
      {rows.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-1 gap-1 border-b border-line py-3 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-6"
        >
          <dt className="text-sm text-ink-subtle">{row.label}</dt>
          <dd className="text-sm text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ── Mono ─────────────────────────────────────────────────────────────────── */

/**
 * Inline monospace for a digest, key or identifier.
 *
 * `break-all` because a 64-character hex digest with no break opportunity will
 * push a mobile layout sideways, and horizontal scroll on a phone is how a
 * reader concludes a page is broken.
 */
export function Mono({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "break-all font-mono text-[0.8125rem] text-ink-muted",
        className,
      )}
      {...props}
    />
  );
}

/* ── Rule ─────────────────────────────────────────────────────────────────── */

export function Rule({ className, ...props }: ComponentProps<"hr">) {
  return (
    <hr className={cn("border-0 border-t border-line", className)} {...props} />
  );
}
