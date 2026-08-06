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
}: {
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  /** What on this page is synthetic or simulated. Required — see above. */
  honesty: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-line bg-surface">
      <Container>
        <div className="py-10 lg:py-14">
          <Eyebrow>{eyebrow}</Eyebrow>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[46rem]">
              <h1 className="text-h1">{title}</h1>
              <p className="mt-3 text-lead text-ink-muted">{lead}</p>
            </div>
            {actions && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {actions}
              </div>
            )}
          </div>

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
        </div>
      </Container>
    </div>
  );
}
