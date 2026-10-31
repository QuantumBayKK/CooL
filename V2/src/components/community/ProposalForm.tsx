"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { communityBrowser } from "@/lib/community/browser";
import { CATEGORIES, FIELDS, PROJECT_TYPES, proposalFieldsError } from "@/lib/community/commons";

type Initial = {
  id?: string; status?: string; title: string; summary: string; category: string; project_type: string;
  seeks_team: boolean; beginner_friendly: boolean; fields: Record<string, string>; tags: string;
};

const ERR: Record<string, string> = { "42501": "You need to finish joining first.", "54000": "You can create 3 proposals a day.", "22023": "Please check the fields." };

/** Create a proposal (as a draft or straight into discussion), or publish a new version of one. */
export function ProposalForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const editing = Boolean(initial.id);
  const voting = initial.status === "voting_open";
  const [v, setV] = useState(initial);
  const [material, setMaterial] = useState(voting);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const setField = (k: string, value: string) => setV((x) => ({ ...x, fields: { ...x.fields, [k]: value } }));

  const save = async (submit: boolean) => {
    const title = v.title.trim(), summary = v.summary.trim();
    const problem = title.length < 4 || title.length > 80 ? "Title: 4 to 80 characters."
      : summary.length < 20 || summary.length > 280 ? "Summary: 20 to 280 characters." : proposalFieldsError(v.fields);
    if (problem) return setError(problem);
    const supabase = communityBrowser();
    if (!supabase) return;
    const fields: Record<string, unknown> = {};
    for (const f of FIELDS) { const x = (v.fields[f.key] ?? "").trim(); if (x) fields[f.key] = x; }
    const tags = v.tags.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 8);
    if (tags.length) fields.tags = tags;
    setBusy(true);
    setError("");
    if (editing) {
      const { error: e } = await supabase.rpc("edit_proposal", { p_id: v.id, p_title: title, p_summary: summary, p_fields: fields, p_material: material, p_note: note });
      setBusy(false);
      if (e) return setError(e.code === "22023" ? e.message : "Could not save the new version.");
      router.push(`/community/proposals/${v.id}`);
      router.refresh();
      return;
    }
    const { data, error: e } = await supabase.rpc("create_proposal", {
      p_title: title, p_summary: summary, p_category: v.category, p_type: v.project_type,
      p_seeks_team: v.seeks_team, p_beginner: v.beginner_friendly, p_fields: fields, p_submit: submit,
    });
    setBusy(false);
    if (e) return setError(ERR[e.code ?? ""] ?? "Could not save the proposal.");
    router.push(`/community/proposals/${data}`);
    router.refresh();
  };
  const onSubmit = (e: FormEvent) => { e.preventDefault(); void save(true); };

  return (
    <form className="cm-stack" onSubmit={onSubmit} noValidate>
      <section className="cm-panel cm-stack">
        <h2>The idea</h2>
        <label className="cm-field"><span>Project name</span><input value={v.title} maxLength={80} onChange={(e) => setV({ ...v, title: e.target.value })} /></label>
        <label className="cm-field"><span>One-sentence summary <small>{v.summary.trim().length}/280</small></span>
          <textarea rows={2} value={v.summary} maxLength={280} onChange={(e) => setV({ ...v, summary: e.target.value })} />
        </label>
        {!editing && (
          <div className="cm-grid">
            <label className="cm-field"><span>Category</span>
              <select value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })}>{CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            </label>
            <label className="cm-field"><span>Project type</span>
              <select value={v.project_type} onChange={(e) => setV({ ...v, project_type: e.target.value })}>{PROJECT_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            </label>
          </div>
        )}
        {!editing && (
          <div className="cm-actions">
            <label className="cm-check"><input type="checkbox" checked={v.seeks_team} onChange={(e) => setV({ ...v, seeks_team: e.target.checked })} /> Looking for a team (untick for a solo project)</label>
            <label className="cm-check"><input type="checkbox" checked={v.beginner_friendly} onChange={(e) => setV({ ...v, beginner_friendly: e.target.checked })} /> Good for beginners</label>
          </div>
        )}
        <label className="cm-field"><span>Tags <small>Comma-separated, up to 8</small></span><input value={v.tags} onChange={(e) => setV({ ...v, tags: e.target.value })} placeholder="rust, cli, verification" /></label>
      </section>

      <section className="cm-panel cm-stack">
        <h2>The details</h2>
        <p className="cm-small cm-muted">Only problem and solution are required. Everything else helps people vote with confidence.</p>
        {FIELDS.map((f) => (
          <label key={f.key} className="cm-field">
            <span>{f.label}{f.required ? "" : <small> Optional</small>}</span>
            {f.long || f.required ? (
              <textarea rows={f.required ? 4 : 3} maxLength={4000} value={v.fields[f.key] ?? ""} placeholder={f.hint} onChange={(e) => setField(f.key, e.target.value)} />
            ) : (
              <input value={v.fields[f.key] ?? ""} maxLength={f.key === "repo_url" ? 300 : 4000} placeholder={f.hint} inputMode={f.key === "repo_url" ? "url" : undefined} onChange={(e) => setField(f.key, e.target.value)} />
            )}
          </label>
        ))}
      </section>

      {editing && (
        <section className="cm-panel cm-stack">
          <h2>This version</h2>
          <label className="cm-field"><span>What changed? <small>Optional, shown in the version history</small></span><input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} /></label>
          <label className="cm-check">
            <input type="checkbox" checked={material} disabled={voting} onChange={(e) => setMaterial(e.target.checked)} />
            <span>This is a material change (scope, solution or licence).{voting && <strong> A vote is open: saving restarts it, and the reason is shown publicly.</strong>}</span>
          </label>
        </section>
      )}

      {error && <p className="cm-error" role="alert">{error}</p>}
      <div className="cm-actions">
        <button className="cm-btn" disabled={busy}>{busy ? "Saving…" : editing ? "Publish new version" : "Submit for discussion"}</button>
        {!editing && <button type="button" className="cm-btn secondary" disabled={busy} onClick={() => save(false)}>Save as draft</button>}
      </div>
    </form>
  );
}
