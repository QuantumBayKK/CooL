import { cn } from "@/lib/cn";

export interface SealMarkProps {
  className?: string;
  /** Pixel size of the mark. */
  size?: number;
}

/**
 * The seal glyph — the visual signature of "proven" (CDS §3.1 accent discipline).
 * A ring enclosing a check; rendered in the verify accent via currentColor. Parent
 * timelines animate it (target `.seal-ring` / `.seal-check`) for the sealing moment.
 */
export function SealMark({ className, size = 96 }: SealMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden
      className={cn("text-verify", className)}
    >
      <circle
        className="seal-ring"
        cx="50"
        cy="50"
        r="42"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        pathLength={1}
        opacity={0.9}
      />
      <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.75" opacity={0.35} />
      <path
        className="seal-check"
        d="M37 51l9 9 18-20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
      />
    </svg>
  );
}
