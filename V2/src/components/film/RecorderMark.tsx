/** The small flight-recorder mark: a ribbed box with a locator beacon. */
export function RecorderMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="2" y="5" width="18" height="14" />
      <path d="M6 5v14M10 5v14M14 5v14" />
      <rect x="16" y="1" width="3" height="4" fill="currentColor" stroke="none" />
    </svg>
  );
}
