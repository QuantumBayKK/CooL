import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/primitives";

/**
 * The empty state for a section whose content is not published.
 *
 * This exists instead of placeholder figures, and the distinction is the whole
 * point. An investor who opens "Financial projections" and finds invented
 * numbers has learned something fatal about the company — and would be right
 * to. One who finds a clear statement of why it is not here, and a way to ask,
 * has learned nothing bad at all.
 *
 * It is the same rule the public site applies to simulated attestation: say
 * what is not there, plainly, in the place where someone is looking for it.
 */
export function AwaitingContent({
  title,
  note,
}: {
  title: string;
  note?: string;
}) {
  return (
    <div className="border border-line bg-surface p-6 sm:p-8">
      <StatusBadge status="neutral">Not published here</StatusBadge>

      <h2 className="mt-4 text-h3">
        {title} is not in the room.
      </h2>

      {note && (
        <p className="mt-3 max-w-[62ch] text-sm text-ink-muted">{note}</p>
      )}

      <p className="mt-4 max-w-[62ch] text-sm text-ink-muted">
        We would rather show you an empty section than a populated one you
        cannot rely on. If you need this to proceed, ask — it is usually a
        conversation rather than a document.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/contact">Request it</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/investor/diligence">Read the technical diligence</Link>
        </Button>
      </div>
    </div>
  );
}
