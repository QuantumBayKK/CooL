import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WelcomeForm } from "@/components/community/WelcomeForm";
import { isWelcomed, requireMember } from "@/lib/community/member";
import { safeReturnPath } from "@/lib/community/paths";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ next?: string; edit?: string }> }) {
  const sp = await searchParams;
  const next = safeReturnPath(sp.next);
  const member = await requireMember("/community/welcome", { welcomed: false });
  if (isWelcomed(member) && !sp.edit) redirect(next);
  const p = member.profile;
  return (
    <section className="cm-in cm-stack" aria-labelledby="welcome-title" style={{ maxWidth: "46rem" }}>
      <div>
        <p className="cm-eyebrow">Welcome to Northwind Cipher</p>
        <h1 id="welcome-title">{sp.edit ? "Edit your answers." : "A few quick questions."}</h1>
        <p className="cm-lead">About a minute. Your answers help the team welcome you; you choose who else sees them on your profile.</p>
      </div>
      <WelcomeForm
        next={next}
        initial={{
          name: p?.full_name ?? "",
          handle: p?.handle ?? "",
          tried: p?.tried_cool ?? "",
          usage: p?.cool_usage ?? "",
          reason: p?.join_reason ?? "",
          guidelines: Boolean(p?.guidelines_accepted_at),
        }}
      />
    </section>
  );
}
