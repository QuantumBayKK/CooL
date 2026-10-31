import Link from "next/link";
import type { Metadata } from "next";

import { ProposalCard } from "@/components/community/ProposalCard";
import { CATEGORIES, STATUS, type Proposal } from "@/lib/community/commons";
import { getMember, isWelcomed } from "@/lib/community/member";
import { communityServer } from "@/lib/community/supabase";

export const metadata: Metadata = { title: "Proposals" };

const STAGES = [["", "All open"], ["idea", "In discussion"], ["vote", "Voting"], ["incubating", "Incubating"], ["project", "Projects"], ["closed", "Archive"]] as const;
const SORTS = [["updated", "Recently active"], ["new", "Recently proposed"], ["discussed", "Most discussed"]] as const;

type Search = { q?: string; category?: string; stage?: string; sort?: string; beginner?: string; mine?: string };

export default async function ProposalsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const member = await getMember();
  const supabase = (await communityServer())!;
  let query = supabase.from("proposals").select("*").limit(200);
  const stage = STAGES.some(([k]) => k === sp.stage) ? sp.stage ?? "" : "";
  const statuses = Object.entries(STATUS).filter(([, v]) => (stage ? v.stage === stage : v.stage !== "closed")).map(([k]) => k);
  query = sp.mine && member ? query.eq("author_id", member.id) : query.in("status", statuses.filter((s) => s !== "draft"));
  if (CATEGORIES.some(([k]) => k === sp.category)) query = query.eq("category", sp.category!);
  if (sp.beginner) query = query.eq("beginner_friendly", true);
  const q = (sp.q ?? "").trim().slice(0, 80);
  if (q) query = query.textSearch("title", q.split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}-]/gu, "")).filter(Boolean).join(" & ") || "x", { config: "english" });
  const sort = sp.sort === "new" ? "created_at" : sp.sort === "discussed" ? "comment_count" : "updated_at";
  const { data, error } = await query.order(sort, { ascending: false });
  const rows = (data as Proposal[] | null) ?? [];

  return (
    <div className="cm-in cm-stack">
      <header className="cm-head">
        <p className="cm-eyebrow">The Commons / Idea wall</p>
        <h1>Proposals.</h1>
        <p className="cm-lead">Ideas for open-source projects, in the open. Popularity isn&apos;t quality: read the details, ask questions, and vote when it opens.</p>
        <div className="cm-actions" style={{ marginTop: "1.25rem" }}>
          {isWelcomed(member) && <Link className="cm-btn" href="/community/proposals/new">Propose a project</Link>}
          {member && <Link className="cm-btn secondary" href="/community/proposals?mine=1">My proposals and drafts</Link>}
        </div>
      </header>
      <form className="cm-panel cm-grid" role="search" method="get">
        <label className="cm-field"><span>Search titles</span><input name="q" defaultValue={q} maxLength={80} /></label>
        <label className="cm-field"><span>Category</span>
          <select name="category" defaultValue={sp.category ?? ""}><option value="">All</option>{CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </label>
        <label className="cm-field"><span>Stage</span>
          <select name="stage" defaultValue={stage}>{STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </label>
        <label className="cm-field"><span>Sort</span>
          <select name="sort" defaultValue={sp.sort ?? "updated"}>{SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </label>
        <label className="cm-check" style={{ alignSelf: "end" }}><input type="checkbox" name="beginner" value="1" defaultChecked={Boolean(sp.beginner)} /> Beginner friendly</label>
        <div className="cm-actions" style={{ alignSelf: "end" }}><button className="cm-btn small">Apply</button></div>
      </form>
      {error ? <p className="cm-error" role="alert">Proposals could not be loaded. Please try again.</p>
        : rows.length === 0 ? <div className="cm-empty">No proposals match.</div>
        : <div className="cm-grid">{rows.map((p) => <ProposalCard key={p.id} p={p} />)}</div>}
    </div>
  );
}
