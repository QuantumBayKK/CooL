import { cn } from "@/lib/utils";

/**
 * The one loading indicator in the system.
 *
 * A 16px ring with a single accent arc. It is small on purpose: most routes
 * here resolve in well under a second, and a full-screen spinner on a
 * two-hundred-millisecond wait is a flash of alarm the reader did not need. At
 * this size it reads as "working" without reading as "stuck".
 *
 * The written label is not optional decoration. Under
 * `prefers-reduced-motion` the global rule in globals.css freezes every
 * animation on the page, which would leave the ring sitting perfectly still —
 * indistinguishable from a hung request. The label is what still says
 * "loading" when the motion is gone, and it is what a screen reader announces
 * in either case.
 */
export function Loader({
  label = "Loading",
  className,
  size = 16,
}: {
  label?: string;
  className?: string;
  /** Ring diameter in px. Keep it near text size — see the note above. */
  size?: number;
}) {
  return (
    <span
      role="status"
      className={cn("inline-flex items-center gap-2.5 text-ink-subtle", className)}
    >
      <span
        aria-hidden
        className="seal-loader"
        style={{ width: size, height: size }}
      />
      <span className="text-label uppercase">{label}</span>
    </span>
  );
}

/**
 * The loader, centred in whatever space it is given.
 *
 * Used as the Suspense fallback for a route segment and for the heavier client
 * islands. `min-h` rather than a full viewport height: the header and footer
 * are already painted by the time this shows, so claiming the whole screen
 * would push them apart and then snap them back when the content lands.
 */
export function LoadingPanel({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[60vh] items-center justify-center px-6 py-24",
        className,
      )}
    >
      <Loader label={label} />
    </div>
  );
}
