import Link from "next/link";
import type { Metadata } from "next";

import { Person } from "@/components/community/Person";
import { getMember, isWelcomed } from "@/lib/community/member";
import { communityServer } from "@/lib/community/supabase";

export const metadata: Metadata = { title: "People" };

type Row = { handle: string; name: string; avatar_url: string | null; role: string; joined_at: string };

const TEAM = [
  { name: "Pranauv Shrinaath (Keni)", role: "System design", href: "https://www.linkedin.com/in/pranauvshrinaath/" },
  { name: "Kailosh Kalimuthu", role: "System architecture and development", href: "https://www.linkedin.com/in/kailoshkalimuthu/" },
];

export default async function PeoplePage() {
  const member = await getMember();
  const supabase = await communityServer();
  const { data, error } = (await supabase?.rpc("list_profiles", { p_limit: 300 })) ?? { data: null, error: true };
  const rows = (data as Row[] | null) ?? [];
  return (
    <div className="cm-in cm-stack">
      <header className="cm-head">
        <p className="cm-eyebrow">Good company</p>
        <h1>Meet your people.</h1>
        <p className="cm-lead">The team behind Northwind Cipher, and everyone in the community.</p>
      </header>

      <section aria-labelledby="team-title" className="cm-stack">
        <h2 id="team-title">The team</h2>
        <div className="cm-grid">
          {TEAM.map((t) => (
            <a key={t.name} className="cm-panel" href={t.href} target="_blank" rel="noopener noreferrer" aria-label={`${t.name} on LinkedIn`}>
              <Person name={t.name} sub={t.role} />
            </a>
          ))}
        </div>
      </section>

      <section aria-labelledby="members-title" className="cm-stack">
        <h2 id="members-title">Members</h2>
        {error ? <p className="cm-error" role="alert">The member list could not be loaded. Please try again.</p>
          : rows.length === 0 ? (
            <div className="cm-empty">
              {member && isWelcomed(member) ? "No one else is here yet."
                : "No one is listed yet. Sign in to see members who keep their profile to members."}
            </div>
          ) : (
            <div className="cm-grid">
              {rows.map((r) => (
                <Link key={r.handle} className="cm-panel" href={`/community/contributors/${r.handle}`}>
                  <Person name={r.name} avatarUrl={r.avatar_url} sub={<>@{r.handle}{r.role === "contributor" && " · Contributor"}</>} />
                </Link>
              ))}
            </div>
          )}
      </section>
    </div>
  );
}
