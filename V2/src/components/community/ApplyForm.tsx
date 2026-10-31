"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { communityBrowser } from "@/lib/community/browser";

const INTERESTS = [["code", "Code"], ["docs", "Docs"], ["tools", "Tooling"], ["other", "Something else"]] as const;
const GITHUB = /^[A-Za-z0-9-]{1,39}$/;
const LINK = /^https:\/\/\S{4,}$/;

/** Apply to contribute to CooL with a GitHub username and links to past work. Reviewed by the owners. */
export function ApplyForm() {
  const router = useRouter();
  const [interest, setInterest] = useState<(typeof INTERESTS)[number][0]>("code");
  const [github, setGithub] = useState("");
  const [links, setLinks] = useState([""]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const evidence = links.map((l) => l.trim()).filter(Boolean);
    const problem = !GITHUB.test(github.trim()) ? "Enter your GitHub username (letters, numbers and dashes)."
      : evidence.length === 0 ? "Add at least one link to work you have done."
      : evidence.some((l) => !LINK.test(l) || l.length > 308) ? "Links must start with https:// and contain no spaces."
      : message.trim().length < 20 ? "Tell us what you'd like to work on (at least 20 characters)."
      : "";
    if (problem) return setError(problem);
    const supabase = communityBrowser();
    const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
    if (!supabase || !data.user) return setError("Your session expired. Please sign in again.");
    setBusy(true);
    setError("");
    const { error: e2 } = await supabase.from("contribution_requests").insert({
      user_id: data.user.id, interest, github: github.trim(), evidence, message: message.trim(),
    });
    setBusy(false);
    if (e2) return setError(e2.code === "23505" ? "You already have an application waiting for review." : "Could not send your application.");
    router.refresh();
  };

  return (
    <form className="cm-stack" onSubmit={submit} noValidate>
      <fieldset className="cm-field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: "0.45rem" }}>What would you work on?</legend>
        <div className="cm-actions">
          {INTERESTS.map(([v, label]) => (
            <label key={v} className="cm-choice" style={{ padding: "0.5rem 0.85rem" }}>
              <input type="radio" name="interest" checked={interest === v} onChange={() => setInterest(v)} />{label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="cm-field"><span>GitHub username</span>
        <input value={github} onChange={(e) => setGithub(e.target.value)} maxLength={39} autoCapitalize="off" spellCheck={false} placeholder="octocat" />
      </label>
      <div className="cm-field"><span>Evidence of your work <small>1 to 5 links: pull requests, repositories, projects</small></span>
        {links.map((l, i) => (
          <input key={i} value={l} inputMode="url" aria-label={`Evidence link ${i + 1}`} placeholder="https://github.com/you/project"
            onChange={(e) => setLinks(links.map((x, k) => (k === i ? e.target.value : x)))} />
        ))}
        {links.length < 5 && <button type="button" className="cm-btn secondary small" style={{ alignSelf: "flex-start" }} onClick={() => setLinks([...links, ""])}>+ Add another link</button>}
      </div>
      <label className="cm-field"><span>What would you like to work on? <small>{message.trim().length}/1500</small></span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1500} rows={4} />
      </label>
      {error && <p className="cm-error" role="alert">{error}</p>}
      <div className="cm-actions"><button className="cm-btn" disabled={busy}>{busy ? "Sending…" : "Send application"}</button></div>
    </form>
  );
}
