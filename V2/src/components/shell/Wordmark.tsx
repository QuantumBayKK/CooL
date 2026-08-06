import { cn } from "@/lib/utils";

/**
 * The mark.
 *
 * A square with one clipped corner: a sealed record. The clip is the point —
 * a sealed thing that has been opened cannot be re-sealed without the break
 * showing, which is the product in one shape.
 *
 * Flat fills only. No gradient, no glow, no stroke animation. It has to survive
 * being rendered at 16px in a browser tab and stamped in one colour on a
 * document header, and anything with a gradient fails both.
 */
export function Wordmark({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Glyph />
      {showText && (
        <span className="font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
          CooL
        </span>
      )}
    </span>
  );
}

export function Glyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-[22px]", className)}
      role="img"
      aria-label="CooL"
      fill="none"
    >
      {/* The sealed body. `currentColor` so it inherits ink in the header and
          inverts correctly on a filled surface without a second asset. */}
      <path
        d="M2 2h14.5L22 7.5V22H2V2Z"
        className="fill-ink"
      />
      {/* The broken corner — deep red, because this is the tamper indication and
          red is the one thing on this site that means "look here". */}
      <path d="M16.5 2 22 7.5h-5.5V2Z" className="fill-accent" />
      {/* Three record lines. Reads as a document at 22px and survives to 16px. */}
      <g className="stroke-canvas" strokeWidth="1.6" strokeLinecap="square">
        <path d="M6 11h12" />
        <path d="M6 14.5h12" />
        <path d="M6 18h7" />
      </g>
    </svg>
  );
}
