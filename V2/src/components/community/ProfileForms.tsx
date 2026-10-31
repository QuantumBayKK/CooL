"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { communityBrowser } from "@/lib/community/browser";
import { bioError, handleError, parseSkills } from "@/lib/community/checks";
import type { Privacy, Visibility } from "@/lib/community/member";

function useSave() {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<string | null>, success: string) => {
    setBusy(true);
    setMsg(null);
    const problem = await fn();
    setBusy(false);
    setMsg(problem ? { ok: false, text: problem } : { ok: true, text: success });
    if (!problem) router.refresh();
  };
  const note = msg && <p className={msg.ok ? "cm-notice" : "cm-error"} role={msg.ok ? "status" : "alert"}>{msg.text}</p>;
  return { run, busy, note, setMsg };
}

async function uid() {
  const supabase = communityBrowser();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  return { supabase, id: data.user?.id ?? null };
}

// The server's and the browser's time zone lists differ, so the list is built in the browser only
// (the server renders just the saved value) to keep hydration identical.
const NO_ZONES: string[] = [];
let zones: string[] | null = null;
const browserZones = () => (zones ??= typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : NO_ZONES);
const noSubscribe = () => () => {};

export function ProfileEditor({ initial }: { initial: { handle: string; bio: string; skills: string[]; timezone: string } }) {
  const [v, setV] = useState({ ...initial, skills: initial.skills.join(", ") });
  const zoneList = useSyncExternalStore(noSubscribe, browserZones, () => NO_ZONES);
  const { run, busy, note } = useSave();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const problem = handleError(v.handle) || bioError(v.bio);
      if (problem) return problem;
      const { supabase, id } = await uid();
      if (!supabase || !id) return "Your session expired. Please sign in again.";
      const { error } = await supabase.from("profiles").update({
        handle: v.handle.trim(), bio: v.bio.trim() || null, skills: parseSkills(v.skills), timezone: v.timezone || null,
      }).eq("id", id);
      if (error) return error.code === "23505" ? "That handle is taken." : "Could not save your profile.";
      return null;
    }, "Profile saved.");
  };
  return (
    <form className="cm-stack" onSubmit={submit} noValidate>
      <label className="cm-field"><span>Handle</span>
        <input value={v.handle} onChange={(e) => setV({ ...v, handle: e.target.value.toLowerCase() })} maxLength={30} autoCapitalize="off" spellCheck={false} />
      </label>
      <label className="cm-field"><span>Bio <small>{v.bio.trim().length}/280</small></span>
        <textarea value={v.bio} onChange={(e) => setV({ ...v, bio: e.target.value })} maxLength={280} rows={3} placeholder="What you build, what you want to learn." />
      </label>
      <label className="cm-field"><span>Skills <small>Comma-separated, up to 20</small></span>
        <input value={v.skills} onChange={(e) => setV({ ...v, skills: e.target.value })} placeholder="TypeScript, cryptography, docs" />
      </label>
      <label className="cm-field"><span>Time zone <small>Optional</small></span>
        <select value={v.timezone} onChange={(e) => setV({ ...v, timezone: e.target.value })}>
          <option value="">Not set</option>
          {v.timezone && !zoneList.includes(v.timezone) && <option value={v.timezone}>{v.timezone}</option>}
          {zoneList.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
      </label>
      {note}
      <div className="cm-actions"><button className="cm-btn" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button><Link className="cm-btn secondary" href="/community/welcome?edit=1&next=/community/profile">Edit welcome answers</Link></div>
    </form>
  );
}

const VIS: [Visibility, string][] = [["public", "Everyone"], ["members", "Members"], ["private", "Only me"]];
const PRESENCE: [Privacy["presence"], string, string][] = [
  ["invisible", "Invisible", "Nobody sees that you're online. Your avatar is hidden from others."],
  ["online", "Online only", "Others see you're online, not where."],
  ["room", "Current room", "Others see which room you're in."],
  ["project", "Project context", "Others see the project room you're working in."],
  ["availability", "Availability", "Online, room, and a status you set (busy, away)."],
];

export function PrivacyEditor({ initial }: { initial: Privacy }) {
  const [v, setV] = useState(initial);
  const { run, busy, note } = useSave();
  const row = (key: "profile" | "bio" | "skills" | "timezone", label: string) => (
    <label className="cm-field" key={key}><span>{label}</span>
      <select value={v[key]} onChange={(e) => setV({ ...v, [key]: e.target.value as Visibility })}>
        {VIS.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </label>
  );
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const { supabase, id } = await uid();
      if (!supabase || !id) return "Your session expired. Please sign in again.";
      const { error } = await supabase.from("profile_privacy").update({
        profile: v.profile, bio: v.bio, skills: v.skills, timezone: v.timezone, presence: v.presence,
        show_last_active: v.show_last_active, dm_policy: v.dm_policy,
      }).eq("user_id", id);
      return error ? "Could not save your privacy settings." : null;
    }, "Privacy settings saved.");
  };
  return (
    <form className="cm-stack" onSubmit={submit}>
      <div className="cm-grid">
        {row("profile", "Who can see your profile")}
        {row("bio", "Bio")}
        {row("skills", "Skills")}
        {row("timezone", "Time zone")}
      </div>
      <fieldset className="cm-field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: "0.45rem" }}>Presence in the office</legend>
        <div className="cm-choices">
          {PRESENCE.map(([value, title, hint]) => (
            <label key={value} className="cm-choice">
              <input type="radio" name="presence" checked={v.presence === value} onChange={() => setV({ ...v, presence: value })} />
              <span><strong>{title}</strong><small>{hint}</small></span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="cm-check"><input type="checkbox" checked={v.show_last_active} onChange={(e) => setV({ ...v, show_last_active: e.target.checked })} /> Show when I was last active</label>
      <label className="cm-field"><span>Who can message me</span>
        <select value={v.dm_policy} onChange={(e) => setV({ ...v, dm_policy: e.target.value as Privacy["dm_policy"] })}>
          <option value="anyone">Any member</option>
          <option value="shared_project">Members who share a project with me</option>
          <option value="nobody">Nobody</option>
        </select>
      </label>
      {note}
      <div className="cm-actions"><button className="cm-btn" disabled={busy}>{busy ? "Saving…" : "Save privacy"}</button></div>
    </form>
  );
}

export function LinkGitHub({ linked }: { linked: boolean }) {
  const [error, setError] = useState("");
  if (linked) return <p className="cm-muted cm-small">GitHub is linked. Merged pull requests can count as verified contributions once the project is connected.</p>;
  const link = async () => {
    const supabase = communityBrowser();
    if (!supabase) return;
    const { error: e } = await supabase.auth.linkIdentity({
      provider: "github",
      options: { redirectTo: `${location.origin}/community/auth/callback?next=/community/profile` },
    });
    if (e) setError(/manual linking|disabled/i.test(e.message) ? "Linking GitHub is not enabled yet." : "Could not start linking. Please try again.");
  };
  return (
    <div className="cm-stack">
      <p className="cm-muted cm-small">Link GitHub so your merged pull requests can count as verified contributions. We never get access to your code.</p>
      <div className="cm-actions"><button type="button" className="cm-btn secondary" onClick={link}>Link GitHub</button></div>
      {error && <p className="cm-error" role="alert">{error}</p>}
    </div>
  );
}

export function YourData() {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const exportData = async () => {
    const supabase = communityBrowser();
    if (!supabase) return;
    const { data, error: e } = await supabase.rpc("export_my_data");
    if (e) return setError("Could not export your data.");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "northwind-community-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const remove = async () => {
    const supabase = communityBrowser();
    if (!supabase) return;
    setBusy(true);
    const { error: e } = await supabase.rpc("delete_my_account", { p_confirm: confirm });
    if (e) {
      setBusy(false);
      return setError(e.message.includes("owners") ? "Owner accounts can't be deleted here." : "Could not delete your account.");
    }
    // The account no longer exists on the server; just clear this browser's session.
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/community?deleted=1");
    router.refresh();
  };
  return (
    <div className="cm-stack">
      <div className="cm-actions"><button type="button" className="cm-btn secondary" onClick={exportData}>Download my data (JSON)</button></div>
      <label className="cm-field"><span>Delete my account</span>
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type DELETE to confirm" aria-describedby="del-hint" />
        <small id="del-hint">This removes your profile, privacy settings and applications immediately. It cannot be undone.</small>
      </label>
      <div className="cm-actions"><button type="button" className="cm-btn danger" disabled={confirm !== "DELETE" || busy} onClick={remove}>{busy ? "Deleting…" : "Delete my account"}</button></div>
      {error && <p className="cm-error" role="alert">{error}</p>}
    </div>
  );
}

export function SignOut() {
  const router = useRouter();
  return (
    <button type="button" className="cm-btn secondary" onClick={async () => {
      await communityBrowser()?.auth.signOut();
      router.replace("/community");
      router.refresh();
    }}>Sign out</button>
  );
}
