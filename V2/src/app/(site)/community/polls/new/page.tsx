import type { Metadata } from "next";

import { CreatePollForm } from "@/components/community/CreatePollForm";
import { requireMember } from "@/lib/community/member";

export const metadata: Metadata = { title: "New poll", robots: { index: false } };

export default async function NewPollPage() {
  const member = await requireMember("/community/polls/new");
  if (!member.owner) {
    return <section className="cm-in cm-stack"><p className="cm-eyebrow">Polls</p><h1>Owners only.</h1><p className="cm-lead">Community-wide polls are opened by the owners. Proposal votes are opened by moderators from the proposal page.</p></section>;
  }
  // A week from now, as the default closing time, in the owner's local time (filled in by the browser).
  const defaultCloses = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().slice(0, 16);
  return (
    <div className="cm-in cm-stack" style={{ maxWidth: "48rem" }}>
      <header className="cm-head">
        <p className="cm-eyebrow">The Commons / Voting chamber</p>
        <h1>Open a community poll.</h1>
        <p className="cm-lead">Voters see every rule before they vote, and none can be changed once the poll opens. A poll can only be invalidated, with a public reason.</p>
      </header>
      <CreatePollForm defaultCloses={defaultCloses} />
    </div>
  );
}
