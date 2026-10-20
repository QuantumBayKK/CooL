import { Reveal } from "./Reveal";

export function SectionHead({
  label,
  title,
  lead,
  id,
}: {
  label: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  id?: string;
}) {
  return (
    <Reveal className="f-grid" as="div">
      <p className="f-label f-span-3">{label}</p>
      <div className="f-span-8">
        <h2 id={id} className="f-h2">
          {title}
        </h2>
        {lead && (
          <p className="f-lead" style={{ marginTop: 24 }}>
            {lead}
          </p>
        )}
      </div>
    </Reveal>
  );
}

/** Top-of-page header for inner routes (clears the fixed nav). */
export function PageHead({
  label,
  title,
  lead,
  children,
}: {
  label: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="f-wrap" style={{ paddingTop: "calc(var(--nav) + clamp(72px, 10vw, 144px))", paddingBottom: "clamp(56px, 8vw, 112px)" }}>
      <p className="f-label">{label}</p>
      <h1 className="f-h1" style={{ marginTop: 20, maxWidth: "16ch" }}>
        {title}
      </h1>
      {lead && (
        <p className="f-lead" style={{ marginTop: 28 }}>
          {lead}
        </p>
      )}
      {children && <div style={{ marginTop: 36 }}>{children}</div>}
    </header>
  );
}
