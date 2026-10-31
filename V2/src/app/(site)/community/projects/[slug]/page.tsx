import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { openIssues } from "@/lib/community/github";
import { projectBySlug } from "@/lib/community/projects";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = projectBySlug((await params).slug);
  return { title: p?.name ?? "Project" };
}

const ago = (iso: string) => {
  const d = (Date.now() - Date.parse(iso)) / 864e5;
  return !iso ? "" : d < 1 ? "today" : d < 2 ? "yesterday" : `${Math.floor(d)} days ago`;
};

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = projectBySlug((await params).slug);
  if (!p) notFound();
  const issues = await openIssues(p.repo);
  return (
    <div className="cm-in cm-stack">
      <header className="cm-head">
        <p className="cm-eyebrow">Projects / {p.name}</p>
        <h1>{p.name}</h1>
        <p className="cm-lead">{p.summary}</p>
        <div className="cm-actions" style={{ marginTop: "1.5rem" }}>
          {p.links.slice(0, 2).map((l, i) => (
            <a key={l.href} className={`cm-btn${i ? " secondary" : ""}`} href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{l.label} ↗</a>
          ))}
        </div>
      </header>

      <div className="cm-split">
        <section className="cm-panel" aria-labelledby="issues-title">
          <div className="cm-panel-head">
            <h2 id="issues-title">Open issues</h2>
            {issues.ok && <span className="cm-small cm-muted">Synced {new Date(issues.fetchedAt).toLocaleTimeString("en-GB", { timeStyle: "short" })} · refreshes every 5 min</span>}
          </div>
          {!issues.ok ? (
            <p className="cm-error" role="alert">
              {issues.reason === "rate_limited" ? "GitHub is limiting requests right now." : "GitHub could not be reached."}{" "}
              <a className="cm-link" href={`https://github.com/${p.repo}/issues`} target="_blank" rel="noopener noreferrer">See the issues on GitHub ↗</a>
            </p>
          ) : issues.issues.length === 0 ? (
            <div className="cm-empty">No open issues right now. Read the contribution guide, or propose an improvement.</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {issues.issues.map((i) => (
                <li key={i.number} style={{ padding: "0.85rem 0", borderTop: "1px solid var(--cm-line)" }}>
                  <a className="cm-link" href={i.url} target="_blank" rel="noopener noreferrer">#{i.number} {i.title}</a>
                  <div className="cm-small cm-muted" style={{ marginTop: "0.3rem" }}>
                    {i.author && <>by {i.author} · </>}updated {ago(i.updatedAt)}{i.comments > 0 && <> · {i.comments} comments</>}
                  </div>
                  {i.labels.length > 0 && <div className="cm-tags" style={{ marginTop: "0.45rem" }}>{i.labels.map((l) => <span key={l} className="cm-tag">{l}</span>)}</div>}
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside className="cm-stack">
          <section className="cm-panel">
            <h2>Facts</h2>
            <dl className="cm-dl">
              <dt>Repository</dt><dd>{p.repo}</dd>
              <dt>Language</dt><dd>{p.language}</dd>
              <dt>License</dt><dd>{p.license}</dd>
            </dl>
          </section>
          <section className="cm-panel">
            <h2>Resources</h2>
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {p.links.map((l) => <li key={l.href}><a className="cm-link" href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{l.label}</a></li>)}
            </ul>
            <p className="cm-small cm-muted">Report security issues privately, as described in SECURITY.md, never as a public issue.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
