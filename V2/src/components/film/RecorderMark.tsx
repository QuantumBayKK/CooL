/** The CooL mark: a sealed record — a rounded box with a check. */
export function RecorderMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" />
      <path d="M7.5 12.5l3 3 6-6.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Wordmark: “CooL” with “by Northwind Cipher”. */
export function Wordmark() {
  return (
    <span className="f-brand__word">
      CooL <small>by Northwind Cipher</small>
    </span>
  );
}
