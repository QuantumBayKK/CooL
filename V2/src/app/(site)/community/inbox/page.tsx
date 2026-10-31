import Link from "next/link";
import type { Metadata } from "next";

import { BlockButton, LiveRefresh, MarkUpdatesRead, Thread, type Msg } from "@/components/community/Inbox";
import { Person } from "@/components/community/Person";
import { requireMember } from "@/lib/community/member";
import { communityServer } from "@/lib/community/supabase";

export const metadata: Metadata = { title: "Inbox", robots: { index: false } };

type Conv = { handle: string; name: string; avatar_url: string | null; last_body: string | null; last_from_me: boolean; last_at: string; unread: number };
type Note = { id: number; kind: string; title: string; href: string | null; read_at: string | null; created_at: string };
type Team = { name: string; member_handle: string | null; joined: boolean };

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ with?: string }> }) {
  const sp = await searchParams;
  await requireMember("/community/inbox" + (sp.with ? `?with=${encodeURIComponent(sp.with)}` : ""));
  const supabase = (await communityServer())!;
  const handle = /^[a-z0-9-]{3,30}$/.test(sp.with ?? "") ? sp.with! : null;
  const [{ data: convs }, { data: notes }, { data: team }] = await Promise.all([
    supabase.rpc("list_conversations"),
    supabase.from("notifications").select("*").neq("kind", "message").order("created_at", { ascending: false }).limit(20),
    supabase.rpc("list_team"),
  ]);
  const list = (convs as Conv[] | null) ?? [];
  let thread: Msg[] = [], canSend = false, blocked = false, other: Conv | undefined;
  if (handle) {
    const [t, c, b] = await Promise.all([
      supabase.rpc("open_thread", { p_handle: handle }),
      supabase.rpc("can_message_handle", { p_handle: handle }),
      supabase.rpc("i_blocked", { p_handle: handle }),
    ]);
    thread = (t.data as Msg[] | null) ?? [];
    canSend = c.data === true;
    other = list.find((x) => x.handle === handle);
    const { data: prof } = await supabase.rpc("get_profile", { p_handle: handle });
    blocked = b.data === true;
    if (!other && prof) other = { handle, name: (prof as { name: string }).name, avatar_url: (prof as { avatar_url?: string }).avatar_url ?? null, last_body: null, last_from_me: false, last_at: "", unread: 0 };
  }
  const teamOnline = ((team as Team[] | null) ?? []).filter((t) => t.joined && t.member_handle);
  const updates = (notes as Note[] | null) ?? [];

  return (
    <div className="cm-in cm-stack">
      <LiveRefresh />
      <h1 className="sr-only">Inbox</h1>
      <div className="cm-inbox">
        <aside className="cm-panel cm-stack" aria-label="Conversations">
          {list.length === 0 && <p className="cm-muted cm-small">No conversations yet.</p>}
          {list.map((c) => (
            <Link key={c.handle} href={`/community/inbox?with=${c.handle}`} className={`cm-conv${c.handle === handle ? " on" : ""}`} aria-current={c.handle === handle ? "page" : undefined}>
              <Person name={c.name} avatarUrl={c.avatar_url} sub={c.last_body ? `${c.last_from_me ? "You: " : ""}${c.last_body.slice(0, 50)}` : ""} />
              {c.unread > 0 && <span className="cm-dot-count" aria-label={`${c.unread} unread`}>{c.unread}</span>}
            </Link>
          ))}
          {teamOnline.filter((t) => !list.some((c) => c.handle === t.member_handle)).map((t) => (
            <Link key={t.member_handle} href={`/community/inbox?with=${t.member_handle}`} className="cm-conv">
              <Person name={t.name} sub="Team · say hello" />
            </Link>
          ))}
        </aside>
        <section className="cm-panel" aria-label={other ? `Conversation with ${other.name}` : "Updates"}>
          {handle ? (
            other || thread.length ? (
              <div className="cm-stack">
                <div className="cm-panel-head"><Person name={other?.name ?? handle} avatarUrl={other?.avatar_url} sub={`@${handle}`} /><BlockButton handle={handle} blocked={blocked} /></div>
                <Thread handle={handle} messages={thread} canSend={canSend} />
              </div>
            ) : <p className="cm-muted">This member isn&apos;t available.</p>
          ) : (
            <div className="cm-stack">
              <h2>Updates</h2>
              <MarkUpdatesRead any={updates.some((n) => !n.read_at)} />
              {updates.length === 0 ? <p className="cm-muted cm-small">Nothing new.</p> : (
                <ul className="cm-stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {updates.map((n) => (
                    <li key={n.id}>
                      {n.href ? <Link className="cm-link" href={n.href}>{n.title}</Link> : n.title}
                      {!n.read_at && <span className="cm-tag warn" style={{ marginLeft: "0.5rem" }}>New</span>}
                      <div className="cm-small cm-muted">{new Date(n.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
