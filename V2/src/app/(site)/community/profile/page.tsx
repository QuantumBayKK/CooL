import Link from "next/link";
import type { Metadata } from "next";

import { ApplyForm } from "@/components/community/ApplyForm";
import { CharacterMaker } from "@/components/community/CharacterMaker";
import { DeskEditor } from "@/components/community/DeskEditor";
import { LinkGitHub, PrivacyEditor, ProfileEditor, SignOut, YourData } from "@/components/community/ProfileForms";
import { requireMember } from "@/lib/community/member";
import { communityServer } from "@/lib/community/supabase";

export const metadata: Metadata = { title: "Profile" };

type Request = { status: "pending" | "approved" | "rejected"; review_note: string | null; created_at: string };

const POINTS: [string, string, string][] = [
  ["joined", "Joined", "Finish the welcome"],
  ["character", "Character", "Make your character"],
  ["desk", "Desk", "Claim a desk in the quiet area"],
  ["proposals", "Proposals", "Propose a project in the Commons"],
  ["comments", "Comments", "Join a discussion"],
  ["votes", "Votes", "Vote in a public poll"],
  ["contributions", "Contributions", "Get approved as a contributor"],
];

export default async function ProfilePage() {
  const member = await requireMember("/community/profile");
  const p = member.profile!;
  const supabase = await communityServer();
  const { data: requests } = (await supabase?.from("contribution_requests").select("status, review_note, created_at")
    .eq("user_id", member.id).order("created_at", { ascending: false }).limit(1)) ?? { data: null };
  const latest = (requests?.[0] as Request | undefined) ?? null;
  const { data: desks } = (await supabase?.rpc("list_desks")) ?? { data: null };
  const myDesk = ((desks as { id: string; owner_handle: string | null; badges: string[]; screen: string }[] | null) ?? []).find((d) => d.owner_handle === p.handle) ?? null;
  const first = p.full_name.split(" ")[0] || "there";
  const { data: pts } = (await supabase?.rpc("my_points")) ?? { data: null };
  const points = (pts as { total: number; parts: Record<string, number> } | null) ?? { total: 0, parts: {} };

  return (
    <div className="cm-in cm-stack">
      <header className="cm-head cm-person" style={{ gap: "1.1rem" }}>
        {p.avatar_url ? <img src={p.avatar_url} alt="" width={64} height={64} referrerPolicy="no-referrer" style={{ width: 64, height: 64 }} />
          : <span className="cm-initial" style={{ width: 64, height: 64 }}>{first.slice(0, 1).toUpperCase()}</span>}
        <div>
          <p className="cm-eyebrow" style={{ marginBottom: "0.4rem" }}>Profile</p>
          <h1>Hello, {first}.</h1>
          <p className="cm-muted">@{p.handle} · {member.email}{member.owner && " · Owner"}{member.moderator && !member.owner && " · Moderator"}</p>
        </div>
      </header>

      <section className="cm-panel" id="points" aria-labelledby="points-title">
        <div className="cm-panel-head">
          <h2 id="points-title">Your points</h2>
          <span className="cm-points">{points.total}</span>
        </div>
        <div className="cm-tags">
          {POINTS.map(([key, label, how]) => (
            <span key={key} className={`cm-tag${points.parts[key] ? " ok" : ""}`} title={how}>{label} · {points.parts[key] ?? 0}</span>
          ))}
        </div>
        <p className="cm-muted cm-small">Earned from what you do: joining (50), making your character (20), claiming a desk (10), each proposal (40), each comment (5, up to 200), each vote in a public poll (10), and each approved contribution (100). Everyone sees your total.</p>
      </section>

      <section className="cm-panel" id="character" aria-labelledby="char-title">
        <h2 id="char-title">Your character</h2>
        <CharacterMaker initial={p.avatar} />
      </section>

      <section className="cm-panel" id="desk" aria-labelledby="desk-title">
        <h2 id="desk-title">Your desk</h2>
        <DeskEditor desk={myDesk} />
      </section>

      <section className="cm-panel" aria-labelledby="contrib-title">
        <h2 id="contrib-title">Contributing to projects</h2>
        {p.role === "contributor" ? (
          <><p><span className="cm-tag ok">Contributor</span></p><p className="cm-muted">Pick an issue and open a pull request on GitHub.</p>
            <div className="cm-actions"><Link className="cm-btn" href="/community/projects">Find a project</Link></div></>
        ) : latest?.status === "pending" ? (
          <><p><span className="cm-tag warn">Under review</span></p><p className="cm-muted">Your application is with the team. This page updates when they decide.</p></>
        ) : member.owner ? (
          <p className="cm-muted">Owners review applications in the admin page.</p>
        ) : (
          <>
            {latest?.status === "rejected" && <p className="cm-muted">Your last application wasn&apos;t approved.{latest.review_note && <> Note from the team: {latest.review_note}</>}</p>}
            <p className="cm-muted">Want to build with others? Share your GitHub and links to work you&apos;ve done on any project. Once the team approves it, you&apos;re marked as a contributor (+100 points).</p>
            <ApplyForm />
          </>
        )}
      </section>

      <div className="cm-split">
        <section className="cm-panel" aria-labelledby="edit-title">
          <h2 id="edit-title">Your profile</h2>
          <ProfileEditor initial={{ handle: p.handle ?? "", bio: p.bio ?? "", skills: p.skills ?? [], timezone: p.timezone ?? "" }} />
        </section>
        <section className="cm-panel" aria-labelledby="about-title">
          <h2 id="about-title">About you</h2>
          <dl className="cm-dl">
            <dt>Name</dt><dd>{p.full_name}</dd>
            <dt>What you want to build</dt><dd>{p.join_reason ?? "—"}</dd>
            <dt>Member since</dt><dd>{p.onboarded_at ? new Date(p.onboarded_at).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "—"}</dd>
          </dl>
          <p className="cm-small"><Link className="cm-link" href={`/community/contributors/${p.handle}`}>See your public profile →</Link></p>
        </section>
      </div>

      <section className="cm-panel" aria-labelledby="privacy-title">
        <h2 id="privacy-title">Privacy</h2>
        <p className="cm-muted cm-small">Everyone can see your profile and find you in the office by default. Narrow any field below, or go invisible. Your email is never shown.</p>
        {member.privacy && <PrivacyEditor initial={member.privacy} />}
      </section>

      <div className="cm-split">
        <section className="cm-panel" aria-labelledby="accounts-title">
          <h2 id="accounts-title">Connected accounts</h2>
          <div className="cm-tags">{member.providers.map((x) => <span key={x} className="cm-tag">{x === "github" ? "GitHub" : x === "google" ? "Google" : x}</span>)}</div>
          <LinkGitHub linked={member.providers.includes("github")} />
        </section>
        <section className="cm-panel" aria-labelledby="data-title">
          <h2 id="data-title">Your data</h2>
          <YourData />
        </section>
      </div>

      <div className="cm-actions"><SignOut /></div>
    </div>
  );
}
