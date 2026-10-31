"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { communityBrowser } from "@/lib/community/browser";
import { ELIGIBILITY, PASS_RULE, POLL_KINDS } from "@/lib/community/commons";

/** Owners open community-wide polls. Every rule is shown to voters before they vote and can't be changed later. */
export function CreatePollForm({ defaultCloses }: { defaultCloses: string }) {
  const router = useRouter();
  const [v, setV] = useState({
    question: "", context: "", kind: "single", binding: false, eligibility: "members", options: ["", ""],
    closes: defaultCloses, quorum: "0", pass_rule: "plurality", vote_change: true, visibility: "anonymous", max: "2", next: "", days: "7",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v, x: unknown) => setV((s) => ({ ...s, [k]: x }));
  const yesNo = v.kind === "yes_no_abstain";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const options = v.options.map((o) => o.trim()).filter(Boolean);
    if (v.question.trim().length < 5) return setError("The question needs at least 5 characters.");
    if (!yesNo && options.length < 2) return setError("Add at least two options.");
    const s = communityBrowser();
    if (!s) return;
    setBusy(true);
    setError("");
    const { data, error: err } = await s.rpc("create_poll", {
      p_subject_type: "community", p_subject: null, p_question: v.question, p_context: v.context, p_kind: v.kind,
      p_binding: v.binding, p_eligibility: v.eligibility, p_options: options.map((label) => ({ label })),
      p_closes_at: new Date(v.closes).toISOString(), p_quorum: Number(v.quorum || 0),
      p_pass_rule: v.binding || yesNo ? (yesNo && v.pass_rule === "plurality" ? "simple_majority" : v.pass_rule) : null,
      p_vote_change: v.vote_change, p_visibility: v.visibility, p_max_choices: v.kind === "multi" ? Number(v.max || 2) : null,
      p_next_action: v.next, p_min_account_days: Number(v.days || 0),
    });
    setBusy(false);
    if (err) return setError(err.message);
    router.push(`/community/polls/${data}`);
  };

  return (
    <form className="cm-panel cm-stack" onSubmit={submit} noValidate>
      <label className="cm-field"><span>Question</span><input value={v.question} maxLength={200} onChange={(e) => set("question", e.target.value)} /></label>
      <label className="cm-field"><span>Context <small>Optional: what voters should know</small></span><textarea rows={3} maxLength={2000} value={v.context} onChange={(e) => set("context", e.target.value)} /></label>
      <div className="cm-grid">
        <label className="cm-field"><span>Type</span>
          <select value={v.kind} onChange={(e) => set("kind", e.target.value)}>{Object.entries(POLL_KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </label>
        <label className="cm-field"><span>Who can vote</span>
          <select value={v.eligibility} onChange={(e) => set("eligibility", e.target.value)}><option value="members">Members</option><option value="contributors">Contributors</option></select>
          <small>{ELIGIBILITY[v.eligibility]}</small>
        </label>
        <label className="cm-field"><span>Minimum account age (days)</span><input inputMode="numeric" value={v.days} onChange={(e) => set("days", e.target.value.replace(/\D/g, ""))} /></label>
        <label className="cm-field"><span>Closes</span><input type="datetime-local" value={v.closes} onChange={(e) => set("closes", e.target.value)} /></label>
        <label className="cm-field"><span>Quorum (ballots)</span><input inputMode="numeric" value={v.quorum} onChange={(e) => set("quorum", e.target.value.replace(/\D/g, ""))} /></label>
        {v.kind === "multi" && <label className="cm-field"><span>Max choices</span><input inputMode="numeric" value={v.max} onChange={(e) => set("max", e.target.value.replace(/\D/g, ""))} /></label>}
      </div>
      {!yesNo && (
        <div className="cm-field"><span>Options</span>
          {v.options.map((o, i) => <input key={i} value={o} maxLength={120} aria-label={`Option ${i + 1}`} onChange={(e) => set("options", v.options.map((x, k) => (k === i ? e.target.value : x)))} />)}
          {v.options.length < 20 && <button type="button" className="cm-btn secondary small" style={{ alignSelf: "flex-start" }} onClick={() => set("options", [...v.options, ""])}>+ Add option</button>}
        </div>
      )}
      <div className="cm-actions">
        <label className="cm-check"><input type="checkbox" checked={v.binding} disabled={v.kind === "interest"} onChange={(e) => set("binding", e.target.checked)} /> Binding decision</label>
        <label className="cm-check"><input type="checkbox" checked={v.vote_change} onChange={(e) => set("vote_change", e.target.checked)} /> Voters can change their vote until it closes</label>
        <label className="cm-check"><input type="checkbox" checked={v.visibility === "public"} onChange={(e) => set("visibility", e.target.checked ? "public" : "anonymous")} /> Publish who voted (never their choices)</label>
      </div>
      {(v.binding || yesNo) && (
        <label className="cm-field"><span>Pass rule</span>
          <select value={v.pass_rule} onChange={(e) => set("pass_rule", e.target.value)}>{Object.entries(PASS_RULE).filter(([k]) => (yesNo ? k !== "plurality" : true)).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </label>
      )}
      <label className="cm-field"><span>Next step after the result <small>Optional</small></span><input value={v.next} maxLength={300} onChange={(e) => set("next", e.target.value)} /></label>
      {error && <p className="cm-error" role="alert">{error}</p>}
      <div className="cm-actions"><button className="cm-btn" disabled={busy}>{busy ? "Opening…" : "Open the poll"}</button></div>
    </form>
  );
}
