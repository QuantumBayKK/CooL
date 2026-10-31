import Link from "next/link";
import { getMember, isWelcomed } from "@/lib/community/member";
import { getFlags } from "@/lib/community/flags";
import { ROOMS } from "@/lib/community/world";

export default async function CommunityHome({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const [member, flags, sp] = await Promise.all([getMember(), getFlags(), searchParams]);
  const welcomed = isWelcomed(member);
  const start = !member ? { href: "/community/login", label: "Join the community" }
    : !welcomed ? { href: "/community/welcome", label: "Finish joining" }
    : { href: "/community/profile", label: "Go to your profile" };
  const open = ROOMS.filter((r) => r.flag === null || flags[r.flag]);
  return (
    <div className="cm-in">
      {sp.deleted && <p className="cm-notice" role="status">Your account has been deleted.</p>}
      <section className="cm-hero" aria-labelledby="home-title">
        <h1 id="home-title">Great things start with <span className="cm-ndot">good company.</span></h1>
        <p className="cm-lead">A home for open-source collaboration around CooL: walk into the office, find a project, propose your own, and decide together what the community builds next.</p>
        <div className="cm-actions">
          <a className="cm-btn" href={start.href}>{start.label} ↗</a>
          <Link className="cm-btn secondary" href="/community/world">Enter the office</Link>
        </div>
      </section>

      <section className="cm-stack" aria-labelledby="inside-title">
        <h2 id="inside-title">Inside the headquarters</h2>
        <div className="cm-grid">
          {ROOMS.slice(0, 6).map((r) => {
            const isOpen = open.includes(r);
            return (
              <div key={r.id} className="cm-panel cm-district">
                <h3>{r.name}</h3>
                <span className={`cm-tag${isOpen ? " ok" : ""}`}>{isOpen ? "Open" : "Opening soon"}</span>
                <p className="cm-muted cm-small">{r.summary}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="cm-panel" style={{ marginTop: "2.5rem" }} aria-labelledby="how-title">
        <p className="cm-eyebrow">You don&apos;t have to know everything</p>
        <h2 id="how-title">Just bring your curiosity.</h2>
        <ol className="cm-stack" style={{ paddingLeft: "1.1rem", margin: 0 }}>
          <li><strong>Sign in</strong> with Google or GitHub and say hello.</li>
          <li><strong>Pick something small.</strong> Docs, tests, examples: it all counts, and solo work is welcome.</li>
          <li><strong>Open a pull request.</strong> Linked GitHub accounts get verified credit for merged work.</li>
        </ol>
      </section>
    </div>
  );
}
