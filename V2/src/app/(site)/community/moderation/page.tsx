import type { Metadata } from "next";

import { requireMember } from "@/lib/community/member";

export const metadata: Metadata = { title: "Moderation", robots: { index: false } };

/** The moderation queue arrives with reporting in Phase 7. Until then reports come in by email. */
export default async function ModerationPage() {
  const member = await requireMember("/community/moderation");
  const allowed = member.owner || member.moderator;
  return (
    <section className="cm-in cm-stack" style={{ maxWidth: "44rem" }}>
      <p className="cm-eyebrow">Moderation</p>
      <h1>{allowed ? "No reports queue yet." : "Moderators only."}</h1>
      <p className="cm-lead">
        {allowed
          ? "In-site reporting, the moderation queue and appeals arrive with messaging. Until then, members report concerns by email, as the guidelines say."
          : "This page is for community moderators."}
      </p>
    </section>
  );
}
