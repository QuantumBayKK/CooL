import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NotOpenYet } from "@/components/community/NotOpenYet";
import { Person } from "@/components/community/Person";
import { CommentThread, FollowButton, ProposalActions, type Comment } from "@/components/community/ProposalClient";
import { CATEGORIES, FIELDS, PROJECT_TYPES, STATUS, when, type Proposal } from "@/lib/community/commons";
import { commonsOpen } from "@/lib/community/flags";
import { getMember, isWelcomed } from "@/lib/community/member";
import { communityServer } from "@/lib/community/supabase";

type Author = { id: string; name: string; handle: string | null; avatar_url: string | null };

async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const supabase = (await communityServer())!;
  await supabase.rpc("close_due_polls");
  const { data } = await supabase.from("proposals").select("*").eq("id", id).maybeSingle();
  return { supabase, proposal: data as Proposal | null };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const r = await load((await params).id);
  return { title: r?.proposal?.title ?? "Proposal" };
}

export default async function ProposalPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string }> }) {
  const [{ id }, sp, member] = await Promise.all([params, searchParams, getMember()]);
  if (!(await commonsOpen(Boolean(member?.owner)))) return <NotOpenYet title="Proposals open soon." body="The idea board arrives with The Commons." />;
  const r = await load(id);
  if (!r?.proposal) notFound();
  const { supabase, proposal: p } = r;
  const shown = Math.min(Math.max(Number(sp.v) || p.current_version, 1), p.current_version);
  const [{ data: versions }, { data: history }, { data: comments }, { data: authors }, following] = await Promise.all([
    supabase.from("proposal_versions").select("version, fields, material, change_note, created_at").eq("proposal_id", id).order("version", { ascending: false }),
    supabase.from("proposal_status_history").select("from_status, to_status, reason, at").eq("proposal_id", id).order("at", { ascending: true }),
    supabase.from("proposal_comments_public").select("*").eq("proposal_id", id).order("created_at", { ascending: true }),
    supabase.rpc("comment_authors", { p_proposal: id }),
    member ? supabase.from("proposal_followers").select("user_id").eq("proposal_id", id).eq("user_id", member.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const vs = (versions as { version: number; fields: Record<string, unknown>; material: boolean; change_note: string | null; created_at: string }[] | null) ?? [];
  const version = vs.find((v) => v.version === shown) ?? vs[0];
  const people = new Map(((authors as Author[] | null) ?? []).map((a) => [a.id, a]));
  const author = people.get(p.author_id);
  const thread: Comment[] = ((comments as (Omit<Comment, "name" | "handle" | "avatar_url">)[] | null) ?? []).map((c) => {
    const a = c.author_id ? people.get(c.author_id) : undefined;
    return { ...c, name: a?.name ?? "Member", handle: a?.handle ?? null, avatar_url: a?.avatar_url ?? null };
  });
  const s = STATUS[p.status];
  const tags = Array.isArray(version?.fields.tags) ? (version.fields.tags as string[]) : [];
  const isModerator = Boolean(member?.moderator || member?.owner);

  return (
    <article className="cm-in cm-stack">
      <header className="cm-head">
        <p className="cm-eyebrow"><Link href="/community/proposals">Proposals</Link> / {CATEGORIES.find(([k]) => k === p.category)?.[1]}</p>
        <h1>{p.title}</h1>
        <p className="cm-lead">{p.summary}</p>
        <div className="cm-tags" style={{ marginTop: "1rem" }}>
          <span className={`cm-tag ${s?.tone ?? ""}`}>{s?.label ?? p.status}</span>
          <span className="cm-tag">{PROJECT_TYPES.find(([k]) => k === p.project_type)?.[1]}</span>
          <span className="cm-tag">{p.seeks_team ? "Seeking a team" : "Solo project"}</span>
          {p.beginner_friendly && <span className="cm-tag">Beginner friendly</span>}
          {tags.map((t) => <span key={t} className="cm-tag">#{t}</span>)}
        </div>
        <div className="cm-actions" style={{ marginTop: "1.25rem" }}>
          {author && <Person name={author.name} avatarUrl={author.avatar_url} sub={<>Proposed {when(p.created_at)}</>} />}
          {member && isWelcomed(member) && <FollowButton proposalId={id} following={Boolean(following.data)} />}
        </div>
      </header>

      {p.active_poll && (
        <Link className="cm-panel" href={`/community/polls/${p.active_poll}`} style={{ borderColor: "rgb(227 184 102 / 0.5)" }}>
          <p className="cm-eyebrow" style={{ margin: 0 }}>Vote open</p>
          <h2>Should this proposal move into incubation?</h2>
          <p className="cm-muted">Read the rules and cast your ballot →</p>
        </Link>
      )}
      {p.duplicate_of && <p className="cm-notice">Archived as a duplicate of <Link className="cm-link" href={`/community/proposals/${p.duplicate_of}`}>another proposal</Link>.</p>}

      {member && (
        <ProposalActions id={id} status={p.status} isAuthor={member.id === p.author_id} isModerator={isModerator} isOwner={member.owner} />
      )}

      <div className="cm-split">
        <section className="cm-panel" aria-labelledby="details-title">
          <div className="cm-panel-head">
            <h2 id="details-title">Details</h2>
            <span className="cm-small cm-muted">Version {version?.version} of {p.current_version}{version && version.version !== p.current_version && <> · <Link className="cm-link" href={`/community/proposals/${id}`}>see latest</Link></>}</span>
          </div>
          <dl className="cm-dl">
            {FIELDS.map((f) => {
              const v = version?.fields[f.key];
              if (typeof v !== "string" || !v) return null;
              return (
                <div key={f.key} style={{ display: "contents" }}>
                  <dt>{f.label}</dt>
                  <dd style={{ whiteSpace: "pre-wrap" }}>{f.key === "repo_url" ? <a className="cm-link" href={v} target="_blank" rel="noopener noreferrer nofollow">{v}</a> : v}</dd>
                </div>
              );
            })}
          </dl>
        </section>
        <aside className="cm-stack">
          <section className="cm-panel" aria-labelledby="hist-title">
            <h2 id="hist-title">Decision history</h2>
            <ol style={{ margin: 0, paddingLeft: "1.1rem" }} className="cm-stack">
              {((history as { from_status: string | null; to_status: string; reason: string | null; at: string }[] | null) ?? []).map((h, i) => (
                <li key={i}><strong>{STATUS[h.to_status]?.label ?? h.to_status}</strong><div className="cm-small cm-muted">{when(h.at)}{h.reason && <> · {h.reason}</>}</div></li>
              ))}
            </ol>
          </section>
          <section className="cm-panel" aria-labelledby="ver-title">
            <h2 id="ver-title">Versions</h2>
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {vs.map((v) => (
                <li key={v.version}>
                  <Link className="cm-link" href={`/community/proposals/${id}?v=${v.version}`}>Version {v.version}</Link>
                  <span className="cm-small cm-muted"> · {when(v.created_at)}{v.material && " · material change"}{v.change_note && ` · ${v.change_note}`}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <section className="cm-stack" aria-labelledby="disc-title">
        <h2 id="disc-title">Discussion <span className="cm-muted" style={{ fontSize: "1rem" }}>({p.comment_count})</span></h2>
        <CommentThread proposalId={id} comments={thread} me={member?.id ?? null}
          canComment={isWelcomed(member) && !["archived", "withdrawn"].includes(p.status)} canModerate={isModerator} />
      </section>
    </article>
  );
}
