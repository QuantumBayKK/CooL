"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { communityBrowser } from "@/lib/community/browser";
import { handleError, nameError, reasonError } from "@/lib/community/checks";

type Initial = { name: string; handle: string; reason: string; guidelines: boolean };

export function WelcomeForm({ initial, next }: { initial: Initial; next: string }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Initial>(k: K, value: Initial[K]) => setV((x) => ({ ...x, [k]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = nameError(v.name) || handleError(v.handle) || reasonError(v.reason)
      || (v.guidelines ? "" : "Please read and accept the community guidelines.");
    if (problem) return setError(problem);
    const supabase = communityBrowser();
    if (!supabase) return setError("Sign-in is not configured on this deployment.");
    setBusy(true);
    setError("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setBusy(false);
      return setError("Your session expired. Please sign in again.");
    }
    const h = await supabase.from("profiles").update({ handle: v.handle.trim() }).eq("id", auth.user.id);
    if (h.error) {
      setBusy(false);
      return setError(h.error.code === "23505" ? "That handle is taken. Try another." : "Could not save your handle.");
    }
    const g = await supabase.rpc("accept_guidelines");
    const o = await supabase.rpc("complete_onboarding", {
      p_name: v.name.trim(), p_tried: null, p_usage: null, p_reason: v.reason.trim(), p_directory: false,
    });
    if (g.error || o.error) {
      setBusy(false);
      return setError(o.error?.code === "22023" ? `Please check your answers: ${o.error.message}.` : "Could not save your answers. Please try again.");
    }
    // First time through, make a character next; editing answers goes straight back.
    router.replace(initial.guidelines ? next : `/community/welcome/character?next=${encodeURIComponent(next)}`);
    router.refresh();
  };

  return (
    <form className="cm-panel cm-stack" onSubmit={submit} noValidate>
      <label className="cm-field">
        <span>Your name</span>
        <input value={v.name} onChange={(e) => set("name", e.target.value)} maxLength={80} autoComplete="name" />
      </label>
      <label className="cm-field">
        <span>Handle</span>
        <input value={v.handle} onChange={(e) => set("handle", e.target.value.toLowerCase())} maxLength={30} autoCapitalize="off" spellCheck={false} />
        <small>Your profile address: /community/contributors/{v.handle || "your-handle"}</small>
      </label>
      <label className="cm-field">
        <span>What do you want to build or work on?</span>
        <textarea value={v.reason} onChange={(e) => set("reason", e.target.value)} maxLength={1000} rows={4} placeholder="For example: an open-source game engine, a privacy tool, or I want to help on someone else's project." />
        <small>{v.reason.trim().length}/1000</small>
      </label>
      <label className="cm-check">
        <input type="checkbox" checked={v.guidelines} onChange={(e) => set("guidelines", e.target.checked)} />
        <span>I have read and agree to the <a className="cm-link" href="/community/guidelines" target="_blank" rel="noopener">community guidelines</a>.</span>
      </label>
      {error && <p className="cm-error" role="alert">{error}</p>}
      <div className="cm-actions">
        <button className="cm-btn" disabled={busy}>{busy ? "Saving…" : "Next: your character"}</button>
      </div>
    </form>
  );
}
