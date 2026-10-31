import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProposalForm } from "@/components/community/ProposalForm";
import type { Proposal } from "@/lib/community/commons";
import { requireMember } from "@/lib/community/member";
import { communityServer } from "@/lib/community/supabase";

export const metadata: Metadata = { title: "Edit proposal" };

export default async function EditProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await requireMember(`/community/proposals/${id}/edit`);
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = (await communityServer())!;
  const { data: p } = await supabase.from("proposals").select("*").eq("id", id).maybeSingle();
  const proposal = p as Proposal | null;
  if (!proposal || proposal.author_id !== member.id) notFound();
  const { data: v } = await supabase.from("proposal_versions").select("fields").eq("proposal_id", id).eq("version", proposal.current_version).maybeSingle();
  const fields = ((v?.fields ?? {}) as Record<string, unknown>);
  const text = Object.fromEntries(Object.entries(fields).filter(([k]) => k !== "tags").map(([k, x]) => [k, String(x ?? "")]));
  return (
    <div className="cm-in cm-stack" style={{ maxWidth: "52rem" }}>
      <header className="cm-head">
        <p className="cm-eyebrow">Edit proposal · version {proposal.current_version + 1}</p>
        <h1>{proposal.title}</h1>
        <p className="cm-lead">Every edit becomes a new version. Earlier versions stay visible.</p>
      </header>
      <ProposalForm initial={{
        id, status: proposal.status, title: proposal.title, summary: proposal.summary, category: proposal.category,
        project_type: proposal.project_type, seeks_team: proposal.seeks_team, beginner_friendly: proposal.beginner_friendly,
        fields: text, tags: Array.isArray(fields.tags) ? (fields.tags as string[]).join(", ") : "",
      }} />
    </div>
  );
}
