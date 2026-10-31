import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function CommunityTermsPage() {
  return (
    <article className="cm-in cm-stack" style={{ maxWidth: "46rem" }}>
      <header className="cm-head">
        <p className="cm-eyebrow">The short version</p>
        <h1>Community terms.</h1>
        <p className="cm-lead">Plain terms for using the Northwind Cipher community.</p>
      </header>
      <section className="cm-panel">
        <h2>Who can join</h2>
        <p>You must be at least 18 years old, or have a parent or guardian&apos;s permission where the law where you live requires it. One account per person.</p>
      </section>
      <section className="cm-panel">
        <h2>Your content</h2>
        <p>You keep ownership of what you post. By posting it here you let us display it in the community. Code you contribute to a project is governed by that project&apos;s licence and contribution guide, on GitHub.</p>
      </section>
      <section className="cm-panel">
        <h2>Behaviour</h2>
        <p>Follow the <Link className="cm-link" href="/community/guidelines">community guidelines</Link>. We may restrict or remove accounts that break them, and we record why.</p>
      </section>
      <section className="cm-panel">
        <h2>The service</h2>
        <p>The community is provided as is, free of charge, and features may change. Votes in the community set priorities; they do not create obligations for Northwind Cipher or grant access to any repository.</p>
      </section>
    </article>
  );
}
