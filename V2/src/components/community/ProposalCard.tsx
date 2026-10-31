import Link from "next/link";

import { CATEGORIES, STATUS, when, type Proposal } from "@/lib/community/commons";

const cat = (c: string) => CATEGORIES.find(([k]) => k === c)?.[1] ?? c;

export function ProposalCard({ p }: { p: Proposal }) {
  const s = STATUS[p.status];
  return (
    <Link className="cm-panel" href={`/community/proposals/${p.id}`}>
      <div className="cm-tags"><span className={`cm-tag ${s?.tone ?? ""}`}>{s?.label ?? p.status}</span><span className="cm-tag">{cat(p.category)}</span>
        {!p.seeks_team && <span className="cm-tag">Solo</span>}{p.beginner_friendly && <span className="cm-tag">Beginner friendly</span>}</div>
      <h3>{p.title}</h3>
      <p className="cm-muted cm-small">{p.summary}</p>
      <p className="cm-small cm-muted">{p.comment_count} comments · updated {when(p.updated_at)}</p>
    </Link>
  );
}

