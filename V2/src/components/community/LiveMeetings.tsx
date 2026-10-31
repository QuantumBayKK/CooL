"use client";

import { useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";

import { endMeeting, meetCode, startMeeting, useMeetings, type Meeting } from "@/lib/community/meetings";

/** Live meetings across the top of every community page (the office shows its own). */
export function LiveMeetings() {
  const path = usePathname();
  const { meetings } = useMeetings();
  if (path === "/community/world" || meetings.length === 0) return null;
  return (
    <div className="cm-live-meet" role="region" aria-label="Live meetings">
      {meetings.map((m) => (
        <div key={m.id} className="cm-live-meet-row">
          <span><i aria-hidden /> Live now · <strong>{m.mine ? "Your meeting" : m.host_name}</strong>: {m.title}</span>
          <span className="cm-actions">
            <a className="cm-btn small" href={m.link} target="_blank" rel="noopener noreferrer">Join</a>
            {m.mine && <button type="button" className="cm-btn secondary small" onClick={() => void endMeeting()}>End</button>}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Start a Google Meet and share it with the whole community, or end the one you're hosting. */
export function MeetingForm({ mine, onDone }: { mine: Meeting | undefined; onDone: (message: string) => void }) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (mine) {
    return (
      <>
        <small>&ldquo;{mine.title}&rdquo; is live for the whole community.</small>
        <div className="cm-actions">
          <a className="cm-btn small" href={mine.link} target="_blank" rel="noopener noreferrer">Join</a>
          <button type="button" className="cm-btn secondary small" onClick={async () => { await endMeeting(); onDone("Meeting ended"); }}>End meeting</button>
        </div>
      </>
    );
  }

  const paste = async () => {
    try { setLink((await navigator.clipboard.readText()).trim().slice(0, 200)); setError(""); }
    catch { setError("Your browser blocked pasting. Click the link box and press Ctrl+V (⌘V on Mac)."); }
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!meetCode(link)) return setError("That isn't a Google Meet link. It looks like meet.google.com/abc-defg-hij.");
    setBusy(true);
    const problem = await startMeeting(title, link);
    setBusy(false);
    if (problem) return setError(problem);
    setTitle(""); setLink(""); setError("");
    onDone("Shared with the whole community");
  };
  return (
    <>
      <small>Start a Google Meet, copy its link, and paste it here. Everyone in the community gets a Join button and a notification.</small>
      <div className="cm-actions"><a className="cm-btn small" href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer">1 · Start a Google Meet</a></div>
      <form className="cm-world-meetform" onSubmit={submit}>
        <input aria-label="Meeting title" placeholder="What's it about? (optional)" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
        <div className="cm-world-meetrow">
          <input aria-label="Google Meet link" placeholder="meet.google.com/abc-defg-hij" value={link} maxLength={200} onChange={(e) => { setLink(e.target.value); setError(""); }} />
          <button type="button" className="cm-btn secondary small" onClick={paste}>Paste</button>
        </div>
        <button type="submit" className="cm-btn small" disabled={busy || !link.trim()}>{busy ? "Sharing…" : "2 · Share with everyone"}</button>
        {error && <small className="cm-error" role="alert">{error}</small>}
      </form>
    </>
  );
}
