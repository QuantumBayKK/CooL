"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { communityBrowser } from "@/lib/community/browser";
import type { PollOption } from "@/lib/community/commons";

type Kind = "single" | "multi" | "yes_no_abstain" | "ranked" | "interest";

/** Casts or changes the member's ballot. The database checks eligibility, the window and the rules. */
export function BallotForm({ pollId, kind, options, mine, maxChoices, voteChange }: {
  pollId: string; kind: Kind; options: PollOption[]; mine: string[] | null; maxChoices: number | null; voteChange: boolean;
}) {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>(mine ?? []);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);
  const locked = Boolean(mine) && !voteChange;
  const many = kind === "multi" || kind === "interest";
  const label = (id: string) => options.find((o) => o.id === id)?.label ?? "";

  const toggle = (id: string) => {
    setDone("");
    if (kind === "single" || kind === "yes_no_abstain") return setPicked([id]);
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : kind === "multi" && maxChoices && p.length >= maxChoices ? p : [...p, id]));
  };
  const move = (i: number, d: -1 | 1) => setPicked((p) => {
    const n = [...p]; const j = i + d;
    if (j < 0 || j >= n.length) return p;
    [n[i], n[j]] = [n[j]!, n[i]!];
    return n;
  });
  const submit = async () => {
    if (!picked.length) return setError("Choose at least one option.");
    const s = communityBrowser();
    if (!s) return;
    setBusy(true);
    setError("");
    const { error: e } = await s.rpc("cast_ballot", { p_poll: pollId, p_choices: picked });
    setBusy(false);
    if (e) return setError(e.code === "22023" || e.code === "42501" ? e.message : e.code === "54000" ? "Slow down a little and try again." : "Your ballot could not be saved.");
    setDone(mine ? "Your vote was updated." : "Your vote was recorded.");
    router.refresh();
  };

  if (locked) {
    return <p className="cm-notice">You voted{kind === "ranked" ? `: ${picked.map(label).join(" → ")}` : `: ${picked.map(label).join(", ")}`}. Votes in this poll can&apos;t be changed.</p>;
  }
  return (
    <div className="cm-stack">
      <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="cm-choices">
        <legend className="cm-small cm-muted" style={{ marginBottom: "0.5rem" }}>
          {kind === "ranked" ? "Pick the options you support, then put them in order of preference." : many ? `Choose ${maxChoices ? `up to ${maxChoices}` : "any"} options.` : "Choose one option."}
        </legend>
        {options.map((o) => (
          <label key={o.id} className="cm-choice">
            <input type={many || kind === "ranked" ? "checkbox" : "radio"} name="ballot" checked={picked.includes(o.id)} onChange={() => toggle(o.id)} />
            <span><strong>{o.label}</strong>{o.description && <small>{o.description}</small>}</span>
          </label>
        ))}
      </fieldset>
      {kind === "ranked" && picked.length > 0 && (
        <ol className="cm-panel cm-stack" aria-label="Your order of preference" style={{ paddingLeft: "2.2rem" }}>
          {picked.map((id, i) => (
            <li key={id}>
              <div className="cm-panel-head">
                <span>{label(id)}</span>
                <span className="cm-actions">
                  <button type="button" className="cm-btn secondary small" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${label(id)} up`}>↑</button>
                  <button type="button" className="cm-btn secondary small" disabled={i === picked.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${label(id)} down`}>↓</button>
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
      {error && <p className="cm-error" role="alert">{error}</p>}
      {done && <p className="cm-notice" role="status">{done}</p>}
      <div className="cm-actions"><button className="cm-btn" disabled={busy} onClick={submit}>{busy ? "Saving…" : mine ? "Update my vote" : "Cast my vote"}</button></div>
    </div>
  );
}

export function PollOwnerActions({ pollId, canClose }: { pollId: string; canClose: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const run = async (fn: string, args: Record<string, unknown>) => {
    const s = communityBrowser();
    if (!s) return;
    const { error: e } = await s.rpc(fn, args);
    if (e) return setError(e.message);
    router.refresh();
  };
  return (
    <div className="cm-stack">
      <div className="cm-actions">
        {canClose && <button className="cm-btn secondary small" onClick={() => confirm("Close this vote now and publish the result?") && run("close_poll", { p_poll: pollId })}>Close now</button>}
        <button className="cm-btn danger small" onClick={() => { const r = prompt("Why invalidate this vote? The reason is published."); if (r) void run("invalidate_poll", { p_poll: pollId, p_reason: r }); }}>Invalidate</button>
      </div>
      {error && <p className="cm-error" role="alert">{error}</p>}
    </div>
  );
}
