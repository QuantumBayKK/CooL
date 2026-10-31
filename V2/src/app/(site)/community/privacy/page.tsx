import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

const CONTACT = "pranauvshrinaath@northwindcipher.com";

/** Keep this page in step with what the community database actually stores (supabase/community/migrations). */
export default function CommunityPrivacyPage() {
  return (
    <article className="cm-in cm-stack" style={{ maxWidth: "46rem" }}>
      <header className="cm-head">
        <p className="cm-eyebrow">Your space</p>
        <h1>Community privacy notice.</h1>
        <p className="cm-lead">What the community stores about you, who can see it, and how to take it with you or delete it.</p>
      </header>
      <section className="cm-panel">
        <h2>What we store</h2>
        <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
          <li><strong>From your sign-in provider</strong> (Google or GitHub): your email address, name and profile picture. We never receive your password.</li>
          <li><strong>What you tell us</strong>: your handle, bio, skills, time zone, your welcome answers, and your office character.</li>
          <li><strong>If you apply to contribute</strong>: your GitHub username, the links you share and your message.</li>
          <li><strong>Your settings</strong>: privacy choices and when you accepted the guidelines.</li>
          <li><strong>Records of team actions</strong> (approvals, permission changes, account deletions), kept so decisions are accountable.</li>
        </ul>
      </section>
      <section className="cm-panel">
        <h2>Who sees it</h2>
        <p>You choose, field by field: everyone, members only, or only you. By default your profile is visible to members only, your time zone is private, and you are invisible in the office. Your email address is never shown to other members. The Northwind Cipher team can see member details to review applications and keep the community safe.</p>
      </section>
      <section className="cm-panel">
        <h2>What we don&apos;t do</h2>
        <p>We don&apos;t sell data, run advertising, or track you across other sites. We don&apos;t keep a history of where your avatar walks, and we never measure people by time online or activity.</p>
      </section>
      <section className="cm-panel">
        <h2>Where it lives</h2>
        <p>Accounts and profiles are stored with Supabase. Project pages read public data from GitHub on our servers.</p>
      </section>
      <section className="cm-panel">
        <h2>Your data, your call</h2>
        <p>From <Link className="cm-link" href="/community/profile">your profile</Link> you can download everything we store about you, change who sees it, or delete your account immediately. Questions: <a className="cm-link" href={`mailto:${CONTACT}?subject=My%20community%20data`}>{CONTACT}</a>.</p>
      </section>
    </article>
  );
}
