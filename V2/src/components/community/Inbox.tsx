"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { communityBrowser } from "@/lib/community/browser";

export type Msg = { id: number; mine: boolean; body: string; created_at: string };

/** Keeps the inbox current: re-renders from the server every few seconds while the tab is visible. */
export function LiveRefresh({ ms = 5000 }: { ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) router.refresh(); }, ms);
    return () => clearInterval(t);
  }, [ms, router]);
  return null;
}

export function Thread({ handle, messages, canSend }: { handle: string; messages: Msg[]; canSend: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [messages.length]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    const s = communityBrowser();
    if (!s) return;
    setBusy(true);
    setError("");
    const { error: err } = await s.rpc("send_message", { p_handle: handle, p_body: body });
    setBusy(false);
    if (err) return setError(err.code === "54000" ? "Slow down a little." : err.code === "42501" ? "You can't message this member." : "Your message wasn't sent.");
    setText("");
    router.refresh();
  };

  return (
    <div className="cm-stack">
      <div className="cm-thread" aria-live="polite">
        {messages.length === 0 ? <p className="cm-muted cm-small">No messages yet. Say hello.</p> : messages.map((m) => (
          <div key={m.id} className={`cm-bubble${m.mine ? " mine" : ""}`}>
            <p>{m.body}</p>
            <time>{new Date(m.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</time>
          </div>
        ))}
        <div ref={end} />
      </div>
      {canSend ? (
        <form className="cm-composer" onSubmit={send}>
          <label className="sr-only" htmlFor="msg">Message</label>
          <textarea id="msg" rows={2} maxLength={2000} value={text} placeholder="Write a message…" onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} />
          <button className="cm-btn" disabled={busy || !text.trim()}>Send</button>
        </form>
      ) : <p className="cm-muted cm-small">This member isn&apos;t taking messages from you right now.</p>}
      {error && <p className="cm-error" role="alert">{error}</p>}
    </div>
  );
}

export function BlockButton({ handle, blocked }: { handle: string; blocked: boolean }) {
  const router = useRouter();
  return (
    <button type="button" className="cm-btn secondary small" onClick={async () => {
      if (!blocked && !confirm("Block this member? Neither of you will be able to message the other.")) return;
      await communityBrowser()?.rpc("set_block", { p_handle: handle, p_on: !blocked });
      router.refresh();
    }}>{blocked ? "Unblock" : "Block"}</button>
  );
}

export function MarkUpdatesRead({ any }: { any: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!any) return;
    const t = setTimeout(async () => {
      const s = communityBrowser();
      const { data } = (await s?.auth.getUser()) ?? { data: { user: null } };
      if (!s || !data.user) return;
      await s.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", data.user.id).is("read_at", null).neq("kind", "message");
      router.refresh();
    }, 1500);
    return () => clearTimeout(t);
  }, [any, router]);
  return null;
}
