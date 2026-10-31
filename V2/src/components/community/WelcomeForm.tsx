"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { communityBrowser } from "@/lib/community/browser";
import { TRIED, handleError, nameError, reasonError, triedError, usageError } from "@/lib/community/checks";

type Initial = { name: string; handle: string; tried: string; usage: string; reason: string; guidelines: boolean };

export function WelcomeForm({ initial, next }: { initial: Initial; next: string }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Initial>(k: K, value: Initial[K]) => setV((x) => ({ ...x, [k]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = nameError(v.name) || handleError(v.handle) || triedError(v.tried) || usageError(v.usage) || reasonError(v.reason)
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
      p_name: v.name.trim(), p_tried: v.tried, p_usage: v.usage.trim(), p_reason: v.reason.trim(), p_directory: false,
    });
    if (g.error || o.error) {
      setBusy(false);
      return setError(o.error?.code === "22023" ? `Please check your answers: ${o.error.message}.` : "Could not save your answers. Please try again.");
    }
    router.replace(next);
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
      <fieldset className="cm-field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: "0.45rem" }}>Have you tried CooL?</legend>
        <div className="cm-choices">
          {TRIED.map(([value, title, hint]) => (
            <label key={value} className="cm-choice">
              <input type="radio" name="tried" value={value} checked={v.tried === value} onChange={() => set("tried", value)} />
              <span><strong>{title}</strong><small>{hint}</small></span>
            </label>
          ))}
        </div>
      </fieldset>
      {(v.tried === "used" || v.tried === "read") && (
        <label className="cm-field">
          <span>{v.tried === "used" ? "What did you use it for?" : "What caught your interest?"} <small>Optional</small></span>
          <textarea value={v.usage} onChange={(e) => set("usage", e.target.value)} maxLength={500} rows={3} />
        </label>
      )}
      <label className="cm-field">
        <span>Why do you want to join?</span>
        <textarea value={v.reason} onChange={(e) => set("reason", e.target.value)} maxLength={1000} rows={4} placeholder="For example: I work on AI governance and want to understand verifiable audit trails." />
        <small>{v.reason.trim().length}/1000</small>
      </label>
      <label className="cm-check">
        <input type="checkbox" checked={v.guidelines} onChange={(e) => set("guidelines", e.target.checked)} />
        <span>I have read and agree to the <a className="cm-link" href="/community/guidelines" target="_blank" rel="noopener">community guidelines</a>.</span>
      </label>
      {error && <p className="cm-error" role="alert">{error}</p>}
      <div className="cm-actions">
        <button className="cm-btn" disabled={busy}>{busy ? "Saving…" : "Finish"}</button>
      </div>
    </form>
  );
}
