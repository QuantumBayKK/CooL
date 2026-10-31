import type { Metadata } from "next";

import { CommunityNav } from "@/components/community/CommunityNav";
import { communityConfigured, getMember, isWelcomed } from "@/lib/community/member";
import { communityServer } from "@/lib/community/supabase";

import "./community.css";

// Every community page reads the member's session, so it renders per request. That also lets the
// middleware's nonce-based script policy apply (prerendered pages cannot carry a nonce).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Community", template: "%s · Community · Northwind Cipher" },
  description: "Build, learn and work on open-source projects together with the Northwind Cipher community.",
};

export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  const member = await getMember();
  let unread = 0;
  if (member && isWelcomed(member)) {
    const supabase = await communityServer();
    const [m, n] = await Promise.all([
      supabase?.rpc("unread_messages"),
      supabase?.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null).neq("kind", "message"),
    ]);
    unread = (typeof m?.data === "number" ? m.data : 0) + (n?.count ?? 0);
  }
  return (
    <div className="cm">
      <CommunityNav
        signedIn={Boolean(member)}
        owner={Boolean(member?.owner)}
        moderator={Boolean(member?.moderator)}
        unread={unread}
      />
      {!communityConfigured() && (
        <p className="cm-error" role="alert" style={{ marginBottom: "1.5rem" }}>
          Community accounts are not configured on this deployment.
        </p>
      )}
      {children}
    </div>
  );
}
