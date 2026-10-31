import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BallotForm, PollOwnerActions } from "@/components/community/BallotForm";
import { ELIGIBILITY, OUTCOME, PASS_RULE, POLL_KINDS, when, type Poll, type PollOption, type PollResult } from "@/lib/community/commons";
import { getMember } from "@/lib/community/member";
import { communityServer } from "@/lib/community/supabase";

export const metadata: Metadata = { title: "Vote" };

export default async function PollPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, member] = await Promise.all([params, getMember()]);
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = (await communityServer())!;
  await supabase.rpc("close_due_polls");
  const { data: pd } = await supabase.from("polls").select("*").eq("id", id).maybeSingle();
  const poll = pd as Poll | null;
  if (!poll) notFound();
  const [{ data: od }, { data: rd }, { data: counts }, { data: audit }, mine, eligible, voters] = await Promise.all([
    supabase.from("poll_options").select("id, position, label, description").eq("poll_id", id).order("position"),
    supabase.from("poll_results").select("*").eq("poll_id", id).maybeSingle(),
    supabase.rpc("poll_counts", { p_poll: id }),
    supabase.from("poll_audit").select("action, note, at").eq("poll_id", id).order("at"),
    member ? supabase.rpc("my_ballot", { p_poll: id }) : Promise.resolve({ data: null }),
    member ? supabase.from("poll_eligibility").select("user_id").eq("poll_id", id).eq("user_id", member.id).maybeSingle() : Promise.resolve({ data: null }),
    poll.visibility === "public" && poll.status === "closed" ? supabase.rpc("poll_voters", { p_poll: id }) : Promise.resolve({ data: null }),
  ]);
  const options = (od as PollOption[] | null) ?? [];
  const result = rd as PollResult | null;
  const c = ((counts as { eligible: number; voted: number }[] | null) ?? [])[0] ?? { eligible: 0, voted: 0 };
  const myBallot = (mine.data as string[] | null) ?? null;
  const label = (oid: string) => options.find((o) => o.id === oid)?.label ?? "—";
  // close_due_polls() above has already closed anything past its closing time.
  const open = poll.status === "open";
  const totalVotes = result ? Object.values(result.tallies).reduce((a, b) => a + b, 0) : 0;

  return (
    <article className="cm-in cm-stack" style={{ maxWidth: "56rem" }}>
      <header className="cm-head">
        <p className="cm-eyebrow">
          <Link href="/community/commons">The Commons</Link> / {poll.subject_type === "proposal" ? <Link href={`/community/proposals/${poll.subject_id}`}>Proposal vote</Link> : "Community poll"}
        </p>
        <h1>{poll.question}</h1>
        {poll.context && <p className="cm-lead" style={{ whiteSpace: "pre-wrap" }}>{poll.context}</p>}
        <div className="cm-tags" style={{ marginTop: "1rem" }}>
          <span className={`cm-tag ${open ? "warn" : ""}`}>{poll.status === "invalidated" ? "Invalidated" : open ? "Open" : "Closed"}</span>
          <span className="cm-tag">{poll.binding ? "Binding decision" : "Advisory, not binding"}</span>
          <span className="cm-tag">{POLL_KINDS[poll.kind]}</span>
        </div>
      </header>

      {poll.status === "invalidated" && <p className="cm-error">This vote was invalidated: {poll.invalidated_reason}</p>}

      <div className="cm-split">
        <section className="cm-panel" aria-labelledby="ballot-title">
          <h2 id="ballot-title">{result ? "Result" : "Your vote"}</h2>
          {result ? (
            <div className="cm-stack">
              <p><span className={`cm-tag ${result.outcome === "passed" || result.outcome === "winner" ? "ok" : ""}`}>{OUTCOME[result.outcome] ?? result.outcome}</span>
                {result.winner && <> · <strong>{label(result.winner)}</strong></>}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }} className="cm-stack">
                {options.map((o) => {
                  const n = result.tallies[o.id] ?? 0;
                  const pct = totalVotes ? Math.round((n / totalVotes) * 100) : 0;
                  return (
                    <li key={o.id}>
                      <div className="cm-panel-head"><span>{o.label}</span><span className="cm-muted">{n} · {pct}%</span></div>
                      <div aria-hidden style={{ height: 6, borderRadius: 3, background: "rgb(255 255 255 / 0.08)", marginTop: 6 }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: "#fff" }} /></div>
                    </li>
                  );
                })}
              </ul>
              {poll.kind === "ranked" && <p className="cm-small cm-muted">Bars show first preferences. Runoff rounds are listed under the rules.</p>}
              <p className="cm-small cm-muted">{result.turnout} of {result.eligible} eligible members voted · quorum {result.quorum_met ? "met" : "not met"} · closed {when(result.closed_at)}</p>
            </div>
          ) : !open ? (
            <p className="cm-muted">This vote is not open.</p>
          ) : !member ? (
            <p className="cm-muted"><Link className="cm-link" href={`/community/login?next=/community/polls/${id}`}>Sign in</Link> to vote if you&apos;re eligible.</p>
          ) : !eligible.data ? (
            <p className="cm-muted">You&apos;re not eligible for this vote. Eligibility was fixed when it opened: {ELIGIBILITY[poll.eligibility]?.toLowerCase()}.</p>
          ) : (
            <BallotForm pollId={id} kind={poll.kind as "single"} options={options} mine={myBallot} maxChoices={poll.max_choices} voteChange={poll.vote_change} />
          )}
          {!result && <p className="cm-small cm-muted">{c.voted} of {c.eligible} eligible members have voted. Results are published when the vote closes, so early totals can&apos;t sway anyone.</p>}
          {member?.owner && poll.status === "open" && <PollOwnerActions pollId={id} canClose />}
        </section>

        <aside className="cm-panel" aria-labelledby="rules-title">
          <h2 id="rules-title">Rules</h2>
          <dl className="cm-dl">
            <dt>Type</dt><dd>{POLL_KINDS[poll.kind]}{poll.kind === "multi" && poll.max_choices && `, up to ${poll.max_choices}`}</dd>
            <dt>Binding</dt><dd>{poll.binding ? "Yes" : "No, advisory only"}</dd>
            <dt>Who can vote</dt><dd>{ELIGIBILITY[poll.eligibility]}{poll.eligibility === "members" && ` (${poll.min_account_days} days)`}</dd>
            <dt>Opens</dt><dd>{when(poll.opens_at)}</dd>
            <dt>Closes</dt><dd>{when(poll.closes_at)}</dd>
            <dt>Quorum</dt><dd>{poll.quorum ? `${poll.quorum} ballots` : "None"}</dd>
            {poll.pass_rule && <><dt>Pass rule</dt><dd>{PASS_RULE[poll.pass_rule]}</dd></>}
            <dt>Changing votes</dt><dd>{poll.vote_change ? "Allowed until the vote closes" : "Not allowed"}</dd>
            <dt>Ballots</dt><dd>{poll.visibility === "anonymous" ? "Anonymous: only totals are published" : "Public: who voted is published after closing (not their choices)"}</dd>
            <dt>Decision owner</dt><dd>{poll.decision_owner}</dd>
            {poll.next_action && <><dt>Next step</dt><dd>{poll.next_action}</dd></>}
          </dl>
          {result?.rounds && (
            <div className="cm-stack">
              <h3>Runoff rounds</h3>
              <ol style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {result.rounds.map((r) => <li key={r.round}>{Object.entries(r.counts).map(([k, n]) => `${label(k)} ${n}`).join(" · ") || "No ballots"}</li>)}
              </ol>
            </div>
          )}
          {(voters.data as { handle: string; name: string }[] | null)?.length ? (
            <div className="cm-stack"><h3>Who voted</h3><p className="cm-small">{(voters.data as { handle: string; name: string }[]).map((v) => v.name).join(", ")}</p></div>
          ) : null}
          <div className="cm-stack">
            <h3>Audit trail</h3>
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }} className="cm-small">
              {((audit as { action: string; note: string | null; at: string }[] | null) ?? []).map((a, i) => <li key={i}>{a.action} · {when(a.at)}{a.note && ` · ${a.note.replace(/_/g, " ")}`}</li>)}
            </ul>
          </div>
        </aside>
      </div>
    </article>
  );
}
