import Link from "next/link";
import type { Metadata } from "next";

import { PROJECTS } from "@/lib/community/projects";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <div className="cm-in cm-stack">
      <header className="cm-head">
        <p className="cm-eyebrow">Project district</p>
        <h1>Projects.</h1>
        <p className="cm-lead">What the community is building. New projects arrive through The Commons: proposed, discussed and voted on by members.</p>
      </header>
      <div className="cm-grid">
        {PROJECTS.map((p) => (
          <Link key={p.slug} className="cm-panel" href={`/community/projects/${p.slug}`}>
            <h2 style={{ fontSize: "1.3rem" }}>{p.name}</h2>
            <p className="cm-muted">{p.summary}</p>
            <div className="cm-tags"><span className="cm-tag ok">Active</span><span className="cm-tag">{p.language}</span><span className="cm-tag">{p.license}</span></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
