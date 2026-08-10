import Link from "next/link";
import type { ReactNode } from "react";

import { Container, Eyebrow, StatusBadge } from "@/components/ui/primitives";

/**
 * The header every evidence surface shares.
 *
 * These five routes (`/verify`, `/pipeline`, `/console`, `/studio`,
 * `/billboard`) run the real cryptography, and each one previously introduced
 * itself differently. One component means the reader learns the shape once, and
 * — more importantly — the honesty banner cannot be omitted from one of them by
 * accident, because it is not optional in the props.
 */
export function SurfaceHeader({
  eyebrow,
  title,
  lead,
  honesty,
  actions,
  compact = false,
}: {
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  /** What on this page is synthetic or simulated. Required — see above. */
  honesty: ReactNode;
  actions?: ReactNode;
  /**
   * Collapse the disclosure into a `<details>` and tighten the spacing.
   *
   * For surfaces where the reader came to press a button. On `/demo` the full
   * header pushed the run control 923px down a 900px viewport on desktop and
   * 1461px down an 844px phone — so the page whose entire purpose is "press
   * this" opened with nothing pressable in sight.
   *
   * The disclosure is collapsed, never dropped: it stays in the markup, stays
   * the first thing under the title, and stays one tap away with its summary
   * visible. That preserves the rule this component exists to enforce — the
   * honesty note cannot be omitted from a surface by accident — while letting
   * a page that is mostly an interactive control behave like one.
   */
  compact?: boolean;
}) {
  return (
    <div className="border-b border-line bg-surface">
      <Container>
        <div className={compact ? "py-6 lg:py-9" : "py-10 lg:py-14"}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[46rem]">
              <h1 className="text-h1">{title}</h1>
              <p
                className={
                  compact
                    ? // Body size on a phone. Three lines of 19px lead was the
                      // last thing keeping the demo's run button below the
                      // fold; it returns to lead size from `sm` up.
                      "mt-2.5 text-body text-ink-muted sm:text-lead"
                    : "mt-3 text-lead text-ink-muted"
                }
              >
                {lead}
              </p>
            </div>
            {actions && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {actions}
              </div>
            )}
          </div>

          {compact ? (
            /* `<details>`, not a JS disclosure: it is keyboard operable and
               correctly announced with no ARIA, it opens before hydration, and
               find-in-page can search inside it while closed. */
            <details className="group mt-5 border border-line bg-canvas">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 p-3 marker:content-none [&::-webkit-details-marker]:hidden">
                <StatusBadge status="warn">What is real here</StatusBadge>
                <span className="text-xs text-ink-subtle underline underline-offset-4 group-open:hidden">
                  Read the disclosure
                </span>
                <span className="hidden text-xs text-ink-subtle underline underline-offset-4 group-open:inline">
                  Hide
                </span>
              </summary>
              <div className="border-t border-line p-3">
                <p className="max-w-[80ch] text-sm text-ink-muted">{honesty}</p>
                <Link
                  href="/security#simulated"
                  className="mt-2.5 inline-block text-xs text-ink-subtle underline underline-offset-4 hover:text-ink"
                >
                  Full disclosure list
                </Link>
              </div>
            </details>
          ) : (
            <div className="mt-7 border border-line bg-canvas p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status="warn">What is real here</StatusBadge>
                <Link
                  href="/security#simulated"
                  className="text-xs text-ink-subtle underline underline-offset-4 hover:text-ink"
                >
                  Full disclosure list
                </Link>
              </div>
              <p className="mt-2.5 max-w-[80ch] text-sm text-ink-muted">
                {honesty}
              </p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
