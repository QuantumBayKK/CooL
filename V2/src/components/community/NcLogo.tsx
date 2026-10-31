/** The Northwind Cipher NC mark as a vector, in the current text colour. */
export const NC_PATHS = [
  "M42 101 L42 857 L134 788 L134 307 C475 560 678 812 870 870 L870 759 C749 720 648 606 551 526 Z",
  "M870 43 L870 153 C728 168 588 296 578 445 L500 380 C530 226 700 73 870 43 Z",
];

export function NcMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 912 912" width={size} height={size} className={className} role="img" aria-label="Northwind Cipher" fill="currentColor">
      {NC_PATHS.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

/** Mark and name, for headers. */
export function NcBrand() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <NcMark size={22} />
      <span className="font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">Northwind Cipher</span>
    </span>
  );
}
