import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Person } from "@/components/community/Person";
import { communityServer } from "@/lib/community/supabase";

type PublicProfile = {
  handle: string; name: string; avatar_url?: string; role: string; joined_at?: string; points?: number;
  bio?: string; skills?: string[]; timezone?: string; self?: boolean;
};

async function load(handle: string) {
  if (!/^[a-z0-9-]{3,30}$/.test(handle)) return null;
  const supabase = await communityServer();
  const { data } = (await supabase?.rpc("get_profile", { p_handle: handle })) ?? { data: null };
  return (data as PublicProfile | null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const p = await load((await params).handle);
  // Hidden and missing profiles share one answer, so a URL can't reveal that a private member exists.
  return { title: p ? p.name : "Profile not available", robots: { index: false } };
}

export default async function ContributorPage({ params }: { params: Promise<{ handle: string }> }) {
  const p = await load((await params).handle);
  if (!p) notFound();
  const supabase = await communityServer();
  const canMessage = !p.self && (await supabase?.rpc("can_message_handle", { p_handle: p.handle }))?.data === true;
  return (
    <article className="cm-in cm-stack" style={{ maxWidth: "48rem" }}>
      <header className="cm-head">
        <p className="cm-eyebrow">@{p.handle}</p>
        <Person name={p.name} avatarUrl={p.avatar_url} sub={<>{p.role === "contributor" ? "Contributor" : "Member"} · {p.points ?? 0} points</>} />
        {canMessage && <div className="cm-actions" style={{ marginTop: "1rem" }}><Link className="cm-btn small" href={`/community/inbox?with=${p.handle}`}>Message</Link></div>}
      </header>
      {p.bio && <section className="cm-panel"><h2>About</h2><p>{p.bio}</p></section>}
      {(p.skills?.length || p.timezone) ? (
        <section className="cm-panel">
          <dl className="cm-dl">
            {p.skills && p.skills.length > 0 && (<><dt>Skills</dt><dd><div className="cm-tags">{p.skills.map((s) => <span key={s} className="cm-tag">{s}</span>)}</div></dd></>)}
            {p.timezone && (<><dt>Time zone</dt><dd>{p.timezone}</dd></>)}
            {p.joined_at && (<><dt>Member since</dt><dd>{new Date(p.joined_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</dd></>)}
          </dl>
        </section>
      ) : null}
      <section className="cm-panel">
        <h2>Contributions</h2>
        <p className="cm-muted">Verified contributions appear here once their projects are connected to GitHub.</p>
      </section>
      {p.self && <p className="cm-small cm-muted">This is how others see your profile. Change what&apos;s shown in <Link className="cm-link" href="/community/profile">your privacy settings</Link>.</p>}
    </article>
  );
}
