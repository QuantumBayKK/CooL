import Link from "next/link";

/** Shown when a feature's flag is off. Says so plainly; nothing behind it is simulated. */
export function NotOpenYet({ title, body }: { title: string; body: string }) {
  return (
    <section className="cm-in cm-stack" style={{ maxWidth: "44rem" }}>
      <p className="cm-eyebrow">Opening soon</p>
      <h1>{title}</h1>
      <p className="cm-lead">{body}</p>
      <div className="cm-actions"><Link className="cm-btn secondary" href="/community/world">Enter the office</Link></div>
    </section>
  );
}
