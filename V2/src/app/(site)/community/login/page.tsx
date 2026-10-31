import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignInButtons } from "@/components/community/SignInButtons";
import { getMember } from "@/lib/community/member";
import { safeReturnPath } from "@/lib/community/paths";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  access_denied: "Sign-in was cancelled.",
  exchange: "That sign-in link expired or was already used. Please try again.",
  blocked: "This account can't join the community.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeReturnPath(sp.next);
  if (await getMember()) redirect(next);
  return (
    <section className="cm-in cm-split" aria-labelledby="login-title">
      <div className="cm-stack">
        <div>
          <p className="cm-eyebrow">Join the community</p>
          <h1 id="login-title">Sign in to the community.</h1>
          <p className="cm-lead">One account for everything: the office, projects, proposals and votes. New here? Signing in creates your account.</p>
        </div>
        {sp.error && <p className="cm-error" role="alert">{ERRORS[sp.error] ?? "Sign-in failed. Please try again."}</p>}
        <SignInButtons next={next} />
        <p className="cm-small cm-muted">
          We receive your name, email address and profile picture from the account you choose. See the{" "}
          <Link className="cm-link" href="/community/privacy">privacy notice</Link> and the{" "}
          <Link className="cm-link" href="/community/guidelines">community guidelines</Link>.
        </p>
      </div>
      <aside className="cm-panel" aria-label="What happens next">
        <h2>What happens next</h2>
        <ol className="cm-stack" style={{ paddingLeft: "1.1rem", margin: 0 }}>
          <li><strong>Sign in</strong> with Google or GitHub. No new password.</li>
          <li><strong>Say hello.</strong> Pick a name and handle, agree to the guidelines, and tell us why you are here.</li>
          <li><strong>Explore.</strong> Walk into the office, browse projects, and join in when you are ready.</li>
        </ol>
        <p className="cm-small cm-muted">Linking GitHub later lets your merged pull requests count as verified contributions.</p>
      </aside>
    </section>
  );
}
