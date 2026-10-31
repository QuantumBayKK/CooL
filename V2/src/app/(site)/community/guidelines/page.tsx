import type { Metadata } from "next";

export const metadata: Metadata = { title: "Guidelines" };

const CONTACT = "pranauvshrinaath@northwindcipher.com";

export default function GuidelinesPage() {
  return (
    <article className="cm-in cm-stack" style={{ maxWidth: "46rem" }}>
      <header className="cm-head">
        <p className="cm-eyebrow">Community trust</p>
        <h1>Good company takes care.</h1>
        <p className="cm-lead">How we work together. Everyone agrees to these when they join.</p>
      </header>
      <section className="cm-panel">
        <h2>Be kind, constructive and curious</h2>
        <p>Welcome newcomers. Give feedback about the work, not the person. Disagree openly and respectfully. Assume good intent, and ask before assuming.</p>
      </section>
      <section className="cm-panel">
        <h2>Not welcome here</h2>
        <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
          <li>Harassment, threats, discrimination or hateful content.</li>
          <li>Impersonating someone, or running extra accounts to sway a vote.</li>
          <li>Spam, scams, or links meant to mislead.</li>
          <li>Sharing someone&apos;s private information or messages without consent.</li>
          <li>Posting credentials, secrets or security vulnerabilities in public.</li>
        </ul>
      </section>
      <section className="cm-panel">
        <h2>Contributing</h2>
        <p>Respect maintainers&apos; time, each project&apos;s licence and its contribution guide. Ask before taking on large work. Credit the people whose work you build on. Community votes set priorities; maintainers still decide what gets merged and who has repository access.</p>
      </section>
      <section className="cm-panel">
        <h2>If something goes wrong</h2>
        <p>Email <a className="cm-link" href={`mailto:${CONTACT}?subject=Community%20concern`}>{CONTACT}</a>. The team reads every report. Reporters are never identified to the person reported. Moderation decisions are recorded, and you can appeal them by replying to the decision.</p>
        <p className="cm-muted cm-small">Security issues in CooL go through the repository&apos;s SECURITY.md, not a public issue.</p>
      </section>
    </article>
  );
}
