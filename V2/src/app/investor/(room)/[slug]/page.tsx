import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { AwaitingContent } from "@/components/investor/AwaitingContent";
import { RoomSectionBody } from "@/components/investor/sections";
import { Eyebrow } from "@/components/ui/primitives";
import { findSection } from "@/content/investor-room";
import { getInvestorSession, recordAccess } from "@/lib/auth/portal";

export const dynamic = "force-dynamic";

/**
 * Every room section except the data room, which needs its own route for
 * signed-URL minting.
 *
 * One file rather than twelve, driven by `content/investor-room.ts`. The
 * alternative — a page file per section — guarantees that the navigation, the
 * audit subject and the actual set of routes drift apart the first time one is
 * renamed.
 *
 * A section with `state: "off"` 404s rather than rendering an empty page.
 * Tokenomics is off because there is no token, and a page that says "tokenomics
 * — coming soon" invites exactly the conversation we do not want to have.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const section = findSection(slug);
  return { title: section?.title ?? "Not found" };
}

export default async function RoomSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const section = findSection(slug);

  if (!section || section.state === "off") notFound();

  // The layout has already established there is a session; this reads the
  // cached one rather than re-querying.
  const session = await getInvestorSession();
  if (session) {
    // Not awaited by the render path — an audit write must never be able to
    // fail a page the investor is entitled to see.
    void recordAccess(session, "page.view", `/investor/${slug}`);
  }

  return (
    <div className="mx-auto w-full max-w-[56rem] px-5 py-10 sm:px-8 lg:py-14">
      <Eyebrow>{section.group}</Eyebrow>
      <h1 className="mt-4 text-h1">{section.title}</h1>
      <p className="mt-3 max-w-[60ch] text-lead text-ink-muted">
        {section.summary}
      </p>

      <div className="mt-10">
        {section.state === "awaiting" ? (
          <AwaitingContent note={section.awaitingNote} title={section.title} />
        ) : (
          <RoomSectionBody slug={section.slug} />
        )}
      </div>
    </div>
  );
}
