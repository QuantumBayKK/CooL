import { Reveal } from "./Reveal";

/** "[ 04 · How it works ]" → "How it works". Labels are plain eyebrows now. */
export function cleanLabel(label: string): string {
  return label
    .replace(/^\[\s*|\s*\]$/g, "")
    .replace(/^[A-Z]?\s?·?\s?\d+\s*·\s*/, "")
    .trim();
}

export function SectionHead({
  label,
  title,
  lead,
  id,
  center = false,
  children,
}: {
  label: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  id?: string;
  center?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Reveal>
      <div
        style={{
          maxWidth: center ? 760 : 820,
          marginInline: center ? "auto" : undefined,
          textAlign: center ? "center" : undefined,
        }}
      >
        <p className="f-label" style={{ color: "var(--brand)" }}>
          {cleanLabel(label)}
        </p>
        <h2 id={id} className="f-h2" style={{ marginTop: 12 }}>
          {title}
        </h2>
        {lead && (
          <p className="f-lead" style={{ marginTop: 16, marginInline: center ? "auto" : undefined }}>
            {lead}
          </p>
        )}
        {children && <div style={{ marginTop: 24 }}>{children}</div>}
      </div>
    </Reveal>
  );
}

/** Top-of-page header for inner routes. */
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
    <header className="f-pagehead">
      <div className="f-dots" aria-hidden="true" />
      <div className="f-wrap" style={{ position: "relative" }}>
        <p className="f-label" style={{ color: "var(--brand)" }}>
          {cleanLabel(label)}
        </p>
        <h1 className="f-h1" style={{ marginTop: 14, maxWidth: "20ch" }}>
          {title}
        </h1>
        {lead && (
          <p className="f-lead" style={{ marginTop: 20 }}>
            {lead}
          </p>
        )}
        {children && <div style={{ marginTop: 32 }}>{children}</div>}
      </div>
    </header>
  );
}
