/**
 * Corner-bracket frame with a mono index label. No timestamp prop: a HUD card
 * that shows a time implies a live source, and these have none.
 */
export function HudFrame({
  index,
  meta,
  children,
  className = "",
  as: Tag = "div",
}: {
  index?: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
}) {
  return (
    <Tag className={`f-hud ${className}`}>
      <span className="f-hud__c" aria-hidden="true" />
      {(index || meta) && (
        <div className="f-hud__head">
          {index && <span className="f-label">{index}</span>}
          {meta}
        </div>
      )}
      {children}
    </Tag>
  );
}

export function StatusChip({ status }: { status: string }) {
  const s = status.toLowerCase().replace(/\s+/g, "-");
  return <span className={`f-chip f-chip--${s}`}>{status}</span>;
}
