"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { communityBrowser } from "@/lib/community/browser";
import { TRIED } from "@/lib/community/checks";
import type { Profile } from "@/lib/community/member";
import { Person } from "./Person";

type Request = {
  id: string; user_id: string; interest: string; message: string; github: string; evidence: string[];
  status: "pending" | "approved" | "rejected"; review_note: string | null; reviewed_at: string | null; created_at: string;
};
type Flag = { key: string; enabled: boolean; note: string | null };
type Cap = { user_id: string; capability: string };
type Tab = "overview" | "members" | "pending" | "decided" | "flags";

const day = (v: string) => new Date(v).toLocaleDateString("en-GB", { dateStyle: "medium" });
const tried = (t: string | null) => TRIED.find(([k]) => k === t)?.[1] ?? "—";
const REFRESH_MS = 30_000;

/** Owner tools. Every action goes through a database function that checks ownership and writes the audit log. */
export function AdminPanel() {
  const [tab, setTab] = useState<Tab>("overview");
  const [people, setPeople] = useState<Profile[] | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [caps, setCaps] = useState<Cap[]>([]);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    const s = communityBrowser();
    if (!s) return;
    const [p, r, f, c] = await Promise.all([
      s.from("profiles").select("*").order("created_at", { ascending: false }).limit(1000),
      s.from("contribution_requests").select("*").order("created_at", { ascending: false }).limit(500),
      s.from("feature_flags").select("key, enabled, note").order("key"),
      s.from("capabilities").select("user_id, capability"),
    ]);
    if (p.error || r.error) return setMsg("Could not load the latest data.");
    setPeople(p.data as Profile[]);
    setRequests(r.data as Request[]);
    setFlags((f.data as Flag[]) ?? []);
    setCaps((c.data as Cap[]) ?? []);
    setLoadedAt(new Date());
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(() => { if (!document.hidden) void load(); }, REFRESH_MS);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [load]);

  const byId = useMemo(() => new Map((people ?? []).map((p) => [p.id, p])), [people]);
  const latest = useMemo(() => {
    const m = new Map<string, Request>();
    for (const r of requests) if (!m.has(r.user_id)) m.set(r.user_id, r);
    return m;
  }, [requests]);

  const act = async (id: string, fn: () => PromiseLike<{ error: unknown }>, ok: string) => {
    setBusy(id);
    setMsg("");
    const { error } = await fn();
    setBusy("");
    setMsg(error ? "That didn't work. It may already have been changed." : ok);
    void load();
  };
  const s = communityBrowser();

  if (people === null) return <div className="cm-empty" role="status">Loading…</div>;
  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending");
  const onboarded = people.filter((p) => p.onboarded_at);
  const contributors = people.filter((p) => p.role === "contributor");
  const q = query.trim().toLowerCase();
  const shown = q ? people.filter((p) => `${p.full_name} ${p.email} ${p.handle ?? ""} ${p.join_reason ?? ""}`.toLowerCase().includes(q)) : people;
  const isMod = (id: string) => caps.some((c) => c.user_id === id && c.capability === "moderate");
  const status = (p: Profile): [string, string] => {
    const r = latest.get(p.id);
    if (p.role === "contributor") return ["Contributor", "ok"];
    if (!p.onboarded_at) return ["Welcome not finished", ""];
    if (r?.status === "pending") return ["Applied", "warn"];
    if (r?.status === "rejected") return ["Declined", ""];
    return ["Member", ""];
  };
  const tabs: [Tab, string, number | null][] = [["overview", "Overview", null], ["members", "Members", people.length], ["pending", "Applications", pending.length], ["decided", "Decided", decided.length], ["flags", "Features", null]];

  return (
    <div className="cm-stack">
      <div className="cm-panel-head">
        <span className="cm-small cm-muted">{loadedAt ? `Updated ${loadedAt.toLocaleTimeString("en-GB", { timeStyle: "short" })}` : ""} · refreshes every 30s</span>
        <button type="button" className="cm-btn secondary small" onClick={() => void load()}>Refresh</button>
      </div>
      {msg && <p className="cm-notice" role="status">{msg}</p>}
      <div className="cm-tabs" role="tablist">
        {tabs.map(([id, name, n]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{name}{n !== null && <span>{n}</span>}</button>)}
      </div>

      {tab === "overview" && (
        <div className="cm-stats">
          {([["Members", people.length, `${people.filter((p) => loadedAt && Date.parse(p.created_at) > loadedAt.getTime() - 7 * 864e5).length} new this week`],
            ["Finished welcome", onboarded.length, `${people.length - onboarded.length} still to finish`],
            ["Contributors", contributors.length, "Approved to contribute to CooL"],
            ["Applications waiting", pending.length, pending.length ? "Review them in Applications" : "All caught up"]] as [string, number, string][]).map(([k, v, h]) => (
            <div key={k} className="cm-panel cm-stat"><p className="cm-eyebrow" style={{ margin: 0 }}>{k}</p><strong>{v}</strong><small>{h}</small></div>
          ))}
        </div>
      )}

      {tab === "members" && (
        <>
          <label className="cm-field"><span className="sr-only">Search members</span><input placeholder="Search by name, email, handle or reason…" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
          {shown.length === 0 ? <div className="cm-empty">{q ? "No members match that search." : "No one has joined yet."}</div> : (
            <div className="cm-table-wrap"><table className="cm-table">
              <thead><tr><th>Member</th><th>Tried CooL</th><th>Why they joined</th><th>Joined</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>{shown.map((p) => {
                const [label, tone] = status(p);
                return (
                  <tr key={p.id}>
                    <td><Person name={p.full_name} avatarUrl={p.avatar_url} sub={p.email} /></td>
                    <td>{tried(p.tried_cool)}</td>
                    <td style={{ maxWidth: "22rem" }}>{p.join_reason ?? <span className="cm-muted">—</span>}</td>
                    <td className="cm-muted">{day(p.created_at)}</td>
                    <td><div className="cm-tags"><span className={`cm-tag ${tone}`}>{label}</span>{isMod(p.id) && <span className="cm-tag">Moderator</span>}</div></td>
                    <td><div className="cm-actions">
                      {p.onboarded_at && <button className="cm-btn secondary small" disabled={busy === p.id} onClick={() => confirm(`${p.role === "contributor" ? "Remove contributor access for" : "Make"} ${p.full_name}${p.role === "contributor" ? "?" : " a contributor?"}`) && act(p.id, () => s!.rpc("set_contributor", { target: p.id, allowed: p.role !== "contributor" }), "Contributor access updated.")}>{p.role === "contributor" ? "Remove contributor" : "Make contributor"}</button>}
                      {p.onboarded_at && <button className="cm-btn secondary small" disabled={busy === p.id} onClick={() => act(p.id, () => s!.rpc("set_capability", { p_target: p.id, p_cap: "moderate", p_on: !isMod(p.id) }), "Moderator permission updated.")}>{isMod(p.id) ? "Remove moderator" : "Make moderator"}</button>}
                    </div></td>
                  </tr>
                );
              })}</tbody>
            </table></div>
          )}
        </>
      )}

      {tab === "pending" && (pending.length === 0 ? <div className="cm-empty">No applications waiting.</div> : pending.map((r) => {
        const p = byId.get(r.user_id);
        return (
          <article key={r.id} className="cm-panel">
            <div className="cm-panel-head"><Person name={p?.full_name ?? ""} avatarUrl={p?.avatar_url} sub={p?.email} /><span className="cm-tag">{day(r.created_at)}</span></div>
            <p className="cm-eyebrow" style={{ margin: 0 }}>{r.interest} · <a className="cm-link" href={`https://github.com/${r.github}`} target="_blank" rel="noopener noreferrer">@{r.github}</a></p>
            <p>{r.message}</p>
            <dl className="cm-dl">
              <dt>Evidence</dt><dd>{r.evidence.map((l) => <div key={l}><a className="cm-link" href={l} target="_blank" rel="noopener noreferrer nofollow">{l}</a></div>)}</dd>
              <dt>Tried CooL</dt><dd>{tried(p?.tried_cool ?? null)}</dd>
              <dt>Why they joined</dt><dd>{p?.join_reason ?? "—"}</dd>
            </dl>
            <label className="cm-field"><span>Note to the member <small>Optional, shown on their profile</small></span>
              <input value={notes[r.id] ?? ""} maxLength={500} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} />
            </label>
            <div className="cm-actions">
              <button className="cm-btn" disabled={busy === r.id} onClick={() => act(r.id, () => s!.rpc("review_request", { request_id: r.id, decision: "approved", note: notes[r.id] || null }), `${p?.full_name ?? "They"} can now contribute.`)}>Approve</button>
              <button className="cm-btn secondary" disabled={busy === r.id} onClick={() => act(r.id, () => s!.rpc("review_request", { request_id: r.id, decision: "rejected", note: notes[r.id] || null }), "Application declined.")}>Decline</button>
            </div>
          </article>
        );
      }))}

      {tab === "decided" && (decided.length === 0 ? <div className="cm-empty">No decisions yet.</div> : (
        <div className="cm-table-wrap"><table className="cm-table">
          <thead><tr><th>Member</th><th>Interest</th><th>Decision</th><th>Reviewed</th></tr></thead>
          <tbody>{decided.map((r) => {
            const p = byId.get(r.user_id);
            return (
              <tr key={r.id}><td><Person name={p?.full_name ?? ""} avatarUrl={p?.avatar_url} sub={p?.email} /></td><td>{r.interest}</td>
                <td><span className={`cm-tag ${r.status === "approved" ? "ok" : ""}`}>{r.status}</span>{r.review_note && <div className="cm-small cm-muted">{r.review_note}</div>}</td>
                <td className="cm-muted">{r.reviewed_at ? day(r.reviewed_at) : "—"}</td></tr>
            );
          })}</tbody>
        </table></div>
      ))}

      {tab === "flags" && (
        <div className="cm-stack">
          <p className="cm-muted cm-small">Switch features on when they are ready. Every change is recorded in the audit log.</p>
          {flags.map((f) => (
            <div key={f.key} className="cm-panel cm-panel-head">
              <div><strong>{f.key}</strong>{f.note && <div className="cm-small cm-muted">{f.note}</div>}</div>
              <button className={`cm-btn small${f.enabled ? "" : " secondary"}`} disabled={busy === f.key} aria-pressed={f.enabled}
                onClick={() => act(f.key, () => s!.rpc("set_flag", { p_key: f.key, p_on: !f.enabled }), `${f.key} is now ${f.enabled ? "off" : "on"}.`)}>{f.enabled ? "On" : "Off"}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
