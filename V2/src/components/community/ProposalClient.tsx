"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { communityBrowser } from "@/lib/community/browser";
import { when } from "@/lib/community/commons";
import { Person } from "./Person";

export type Comment = {
  id: string; parent_id: string | null; body: string; removed: boolean; created_at: string; edited_at: string | null;
  author_id: string | null; name: string; handle: string | null; avatar_url: string | null;
};

function useRpc() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const call = async (fn: string, args: Record<string, unknown>, onOk?: () => void) => {
    const s = communityBrowser();
    if (!s) return false;
    setBusy(true);
    setError("");
    const { error: e } = await s.rpc(fn, args);
    setBusy(false);
    if (e) {
      setError(e.code === "54000" ? "Slow down a little and try again." : e.code === "22023" || e.code === "42501" ? e.message : "That didn't work. Please try again.");
      return false;
    }
    onOk?.();
    router.refresh();
    return true;
  };
  return { call, error, busy };
}

export function CommentThread({ proposalId, comments, me, canComment, canModerate }: {
  proposalId: string; comments: Comment[]; me: string | null; canComment: boolean; canModerate: boolean;
}) {
  const roots = comments.filter((c) => !c.parent_id);
  const replies = (id: string) => comments.filter((c) => c.parent_id === id);
  return (
    <div className="cm-stack">
      {canComment ? <CommentBox proposalId={proposalId} parent={null} /> : <p className="cm-muted cm-small">Sign in and finish joining to take part in the discussion.</p>}
      {roots.length === 0 ? <div className="cm-empty">No comments yet. Start the discussion.</div> : roots.map((c) => (
        <div key={c.id} className="cm-stack">
          <CommentItem c={c} me={me} canComment={canComment} canModerate={canModerate} proposalId={proposalId} />
          <div className="cm-stack" style={{ marginLeft: "clamp(1rem, 4vw, 2.5rem)" }}>
            {replies(c.id).map((r) => <CommentItem key={r.id} c={r} me={me} canComment={false} canModerate={canModerate} proposalId={proposalId} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function CommentItem({ c, me, canComment, canModerate, proposalId }: { c: Comment; me: string | null; canComment: boolean; canModerate: boolean; proposalId: string }) {
  const [mode, setMode] = useState<"" | "reply" | "edit">("");
  const [text, setText] = useState(c.body);
  const { call, error, busy } = useRpc();
  const mine = me !== null && c.author_id === me && !c.removed;
  return (
    <article id={`c-${c.id}`} className="cm-panel" style={{ padding: "1rem 1.2rem" }}>
      <div className="cm-panel-head">
        <Person name={c.removed ? "—" : c.name} avatarUrl={c.removed ? null : c.avatar_url} sub={<>{when(c.created_at)}{c.edited_at && " · edited"}</>} />
      </div>
      {mode === "edit" ? (
        <div className="cm-stack">
          <textarea value={text} maxLength={4000} rows={3} onChange={(e) => setText(e.target.value)} aria-label="Edit comment" />
          <div className="cm-actions">
            <button className="cm-btn small" disabled={busy} onClick={() => call("edit_comment", { p_id: c.id, p_body: text }, () => setMode(""))}>Save</button>
            <button className="cm-btn secondary small" onClick={() => setMode("")}>Cancel</button>
          </div>
        </div>
      ) : (
        <p style={{ whiteSpace: "pre-wrap", color: c.removed ? "var(--cm-dim)" : undefined }}>{c.body}</p>
      )}
      {mode !== "edit" && !c.removed && (
        <div className="cm-actions">
          {canComment && <button className="cm-btn secondary small" onClick={() => setMode(mode === "reply" ? "" : "reply")}>Reply</button>}
          {mine && <button className="cm-btn secondary small" onClick={() => setMode("edit")}>Edit</button>}
          {mine && <button className="cm-btn secondary small" disabled={busy} onClick={() => confirm("Delete this comment?") && call("delete_comment", { p_id: c.id })}>Delete</button>}
          {canModerate && !mine && <button className="cm-btn danger small" disabled={busy} onClick={() => { const r = prompt("Why remove this comment? (shown in the audit log)"); if (r) void call("hide_comment", { p_id: c.id, p_reason: r }); }}>Remove</button>}
        </div>
      )}
      {mode === "reply" && <CommentBox proposalId={proposalId} parent={c.id} onDone={() => setMode("")} />}
      {error && <p className="cm-error" role="alert">{error}</p>}
    </article>
  );
}

function CommentBox({ proposalId, parent, onDone }: { proposalId: string; parent: string | null; onDone?: () => void }) {
  const [text, setText] = useState("");
  const { call, error, busy } = useRpc();
  return (
    <div className="cm-stack">
      <label className="cm-field"><span className="sr-only">{parent ? "Reply" : "Add a comment"}</span>
        <textarea value={text} rows={parent ? 2 : 3} maxLength={4000} placeholder={parent ? "Write a reply…" : "Share a thought, a question or a concern…"} onChange={(e) => setText(e.target.value)} />
      </label>
      {error && <p className="cm-error" role="alert">{error}</p>}
      <div className="cm-actions">
        <button className="cm-btn small" disabled={busy || !text.trim()} onClick={() => call("add_comment", { p_proposal: proposalId, p_parent: parent, p_body: text }, () => { setText(""); onDone?.(); })}>{busy ? "Posting…" : parent ? "Reply" : "Comment"}</button>
      </div>
    </div>
  );
}

export function FollowButton({ proposalId, following }: { proposalId: string; following: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    const s = communityBrowser();
    const { data } = (await s?.auth.getUser()) ?? { data: { user: null } };
    if (!s || !data.user) return;
    setBusy(true);
    if (following) await s.from("proposal_followers").delete().eq("proposal_id", proposalId).eq("user_id", data.user.id);
    else await s.from("proposal_followers").insert({ proposal_id: proposalId, user_id: data.user.id });
    setBusy(false);
    router.refresh();
  };
  return <button className="cm-btn secondary small" disabled={busy} aria-pressed={following} onClick={toggle}>{following ? "Following" : "Follow"}</button>;
}

/** Actions for the author, moderators and owners. The database decides; these only offer what is plausible. */
export function ProposalActions({ id, status, isAuthor, isModerator, isOwner }: { id: string; status: string; isAuthor: boolean; isModerator: boolean; isOwner: boolean }) {
  const router = useRouter();
  const { call, error, busy } = useRpc();
  const [closes, setCloses] = useState(() => new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 16));
  const [quorum, setQuorum] = useState("3");
  const [rule, setRule] = useState("simple_majority");
  const move = (to: string, ask?: string) => {
    const reason = ask ? prompt(ask) : null;
    if (ask && !reason) return;
    void call("transition_proposal", { p_id: id, p_to: to, p_reason: reason });
  };
  const next: Record<string, [string, string][]> = {
    passed: [["incubation", "Start incubation"]], incubation: [["recruiting", "Start recruiting"]],
    recruiting: [["approved_to_launch", "Approve launch"]], approved_to_launch: [["active", "Mark as active project"]],
    active: [["completed", "Mark completed"], ["paused", "Pause"]], paused: [["active", "Resume"], ["archived", "Archive"]], completed: [["archived", "Archive"]],
  };
  const items: React.ReactNode[] = [];
  if (isAuthor && status === "draft") items.push(<button key="sub" className="cm-btn small" disabled={busy} onClick={() => call("submit_proposal", { p_id: id })}>Submit for discussion</button>);
  if (isAuthor && ["draft", "discussion", "revision_requested", "voting_open", "voting_scheduled"].includes(status)) items.push(<button key="edit" className="cm-btn secondary small" onClick={() => router.push(`/community/proposals/${id}/edit`)}>Edit</button>);
  if (isAuthor && status === "revision_requested") items.push(<button key="back" className="cm-btn small" disabled={busy} onClick={() => move("discussion")}>Return to discussion</button>);
  if (isAuthor && ["draft", "submitted", "discussion", "revision_requested", "voting_scheduled"].includes(status)) items.push(<button key="wd" className="cm-btn danger small" disabled={busy} onClick={() => confirm("Withdraw this proposal? It stays visible in the archive.") && move("withdrawn")}>Withdraw</button>);
  if (isModerator && status === "discussion") items.push(<button key="rev" className="cm-btn secondary small" disabled={busy} onClick={() => move("revision_requested", "What should the author clarify?")}>Request revision</button>);
  if (isModerator && ["discussion", "revision_requested", "not_passed", "withdrawn"].includes(status)) items.push(<button key="arc" className="cm-btn danger small" disabled={busy} onClick={() => move("archived", "Why archive it? (spam, duplicate, out of scope…)")}>Archive</button>);
  if (isOwner) for (const [to, label] of next[status] ?? []) items.push(<button key={to} className="cm-btn small" disabled={busy} onClick={() => move(to)}>{label}</button>);
  const canOpenVote = isModerator && status === "discussion";
  if (!items.length && !canOpenVote) return null;
  return (
    <div className="cm-stack">
      {items.length > 0 && <div className="cm-actions">{items}</div>}
      {canOpenVote && (
        <details className="cm-panel">
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>Open a binding vote</summary>
          <div className="cm-grid" style={{ marginTop: "1rem" }}>
            <label className="cm-field"><span>Closes</span><input type="datetime-local" value={closes} onChange={(e) => setCloses(e.target.value)} /></label>
            <label className="cm-field"><span>Quorum (ballots)</span><input inputMode="numeric" value={quorum} onChange={(e) => setQuorum(e.target.value.replace(/\D/g, ""))} /></label>
            <label className="cm-field"><span>Pass rule</span>
              <select value={rule} onChange={(e) => setRule(e.target.value)}><option value="simple_majority">Simple majority</option><option value="two_thirds">Two thirds</option></select>
            </label>
          </div>
          <div className="cm-actions" style={{ marginTop: "1rem" }}>
            <button className="cm-btn small" disabled={busy} onClick={() => call("create_poll", {
              p_subject_type: "proposal", p_subject: id, p_question: "Should this proposal move into incubation?", p_context: null,
              p_kind: "yes_no_abstain", p_binding: true, p_eligibility: "members", p_options: [], p_closes_at: new Date(closes).toISOString(),
              p_quorum: Number(quorum || 0), p_pass_rule: rule, p_vote_change: true, p_visibility: "anonymous", p_max_choices: null,
              p_next_action: "If it passes, the owners start incubation and recruitment.", p_min_account_days: 7,
            })}>Open the vote</button>
          </div>
        </details>
      )}
      {error && <p className="cm-error" role="alert">{error}</p>}
    </div>
  );
}
