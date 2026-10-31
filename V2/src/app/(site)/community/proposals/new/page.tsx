import type { Metadata } from "next";

import { ProposalForm } from "@/components/community/ProposalForm";
import { requireMember } from "@/lib/community/member";

export const metadata: Metadata = { title: "Propose a project" };

export default async function NewProposalPage() {
  await requireMember("/community/proposals/new");
  return (
    <div className="cm-in cm-stack" style={{ maxWidth: "52rem" }}>
      <header className="cm-head">
        <p className="cm-eyebrow">The Commons</p>
        <h1>Propose a project.</h1>
        <p className="cm-lead">You don&apos;t need to be a maintainer to suggest an idea. Describe the problem and a solution; the community helps shape the rest.</p>
      </header>
      <ProposalForm initial={{ title: "", summary: "", category: "devtools", project_type: "tool", seeks_team: true, beginner_friendly: false, fields: {}, tags: "" }} />
    </div>
  );
}
