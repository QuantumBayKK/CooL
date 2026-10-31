import Link from "next/link";
import type { Metadata } from "next";

import { ProposalCard } from "@/components/community/ProposalCard";
import { OUTCOME, STATUS, when, type Poll, type Proposal } from "@/lib/community/commons";
import { getMember, isWelcomed } from "@/lib/community/member";
import { communityServer } from "@/lib/community/supabase";

export const metadata: Metadata = { title: "The Commons" };

export default async function CommonsPage() {
  const member = await getMember();
  const supabase = await communityServer();
  await supabase?.rpc("close_due_polls");
  const [{ data: polls }, { data: props }, { data: results }] = await Promise.all([
    supabase!.from("polls").select("*").in("status", ["open", "closed"]).order("closes_at", { ascending: false }).limit(30),
    supabase!.from("proposals").select("*").neq("status", "draft").order("updated_at", { ascending: false }).limit(60),
    supabase!.from("poll_results").select("poll_id, outcome").limit(30),
  ]);
  const all = (props as Proposal[] | null) ?? [];
  const open = ((polls as Poll[] | null) ?? []).filter((p) => p.status === "open");
  const decided = ((polls as Poll[] | null) ?? []).filter((p) => p.status === "closed").slice(0, 6);
  const outcome = new Map(((results as { poll_id: string; outcome: string }[] | null) ?? []).map((r) => [r.poll_id, r.outcome]));
  const by = (stage: string) => all.filter((p) => STATUS[p.status]?.stage === stage);
  const canPropose = isWelcomed(member);

  return (
    <div className="cm-in cm-stack">
      <header className="cm-head">
        <p className="cm-eyebrow">The Commons</p>
        <h1>Where the community decides what to build.</h1>
        <p className="cm-lead">Propose an open-source project, discuss it in the open, and vote. Passed proposals are incubated into real projects with a team and a repository.</p>
        <div className="cm-actions" style={{ marginTop: "1.5rem" }}>
          {canPropose ? <Link className="cm-btn" href="/community/proposals/new">Propose a project</Link> : <Link className="cm-btn" href="/community/login?next=/community/commons">Sign in to take part</Link>}
          <Link className="cm-btn secondary" href="/community/proposals">All proposals</Link>
          {member?.owner && <Link className="cm-btn secondary" href="/community/polls/new">New community poll</Link>}
        </div>
      </header>

      <section id="polls" className="cm-stack" aria-labelledby="votes-title">
        <h2 id="votes-title">Voting chamber</h2>
        {open.length === 0 ? <div className="cm-empty">No votes are open right now.</div> : (
          <div className="cm-grid">{open.map((p) => (
            <Link key={p.id} className="cm-panel" href={`/community/polls/${p.id}`}>
              <div className="cm-tags"><span className="cm-tag warn">Open</span><span className="cm-tag">{p.binding ? "Binding" : "Advisory"}</span></div>
              <h3>{p.question}</h3>
              <p className="cm-small cm-muted">Closes {when(p.closes_at)}</p>
            </Link>
          ))}</div>
        )}
      </section>

      <section className="cm-stack" aria-labelledby="ideas-title">
        <h2 id="ideas-title">Idea wall</h2>
        {by("idea").length === 0 ? <div className="cm-empty">No ideas in discussion yet. {canPropose && "Be the first."}</div>
          : <div className="cm-grid">{by("idea").slice(0, 9).map((p) => <ProposalCard key={p.id} p={p} />)}</div>}
      </section>

      <section className="cm-stack" aria-labelledby="inc-title">
        <h2 id="inc-title">Incubator and recruitment</h2>
        {by("incubating").length === 0 ? <div className="cm-empty">Nothing incubating yet. Proposals arrive here when a vote passes.</div>
          : <div className="cm-grid">{by("incubating").map((p) => <ProposalCard key={p.id} p={p} />)}</div>}
      </section>

      <section id="showcase" className="cm-stack" aria-labelledby="show-title">
        <h2 id="show-title">Showcase</h2>
        {by("project").length === 0 ? <div className="cm-empty">Launched projects appear here.</div>
          : <div className="cm-grid">{by("project").map((p) => <ProposalCard key={p.id} p={p} />)}</div>}
      </section>

      {decided.length > 0 && (
        <section className="cm-stack" aria-labelledby="dec-title">
          <h2 id="dec-title">Recent decisions</h2>
          <div className="cm-grid">{decided.map((p) => (
            <Link key={p.id} className="cm-panel" href={`/community/polls/${p.id}`}>
              <span className="cm-tag">{OUTCOME[outcome.get(p.id) ?? ""] ?? "Closed"}</span>
              <h3>{p.question}</h3>
              <p className="cm-small cm-muted">Closed {when(p.closes_at)}</p>
            </Link>
          ))}</div>
        </section>
      )}

      <p className="cm-small cm-muted"><Link className="cm-link" href="/community/proposals?stage=closed">Archive</Link>: withdrawn, declined and completed proposals keep their full history.</p>
    </div>
  );
}
