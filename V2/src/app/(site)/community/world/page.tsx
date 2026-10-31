import type { Metadata } from "next";

import { World, type Desk, type TeamMember } from "@/components/community/World";
import { getFlags } from "@/lib/community/flags";
import { requireMember } from "@/lib/community/member";
import { communityServer } from "@/lib/community/supabase";

export const metadata: Metadata = { title: "World" };

export default async function WorldPage({ searchParams }: { searchParams: Promise<{ tour?: string }> }) {
  const member = await requireMember("/community/world");
  const [flags, supabase] = await Promise.all([getFlags(), communityServer()]);
  const [{ data: team }, { data: desks }] = await Promise.all([
    supabase ? supabase.rpc("list_team") : Promise.resolve({ data: null }),
    supabase ? supabase.rpc("list_desks") : Promise.resolve({ data: null }),
  ]);
  const p = member.profile!;
  return (
    <section className="cm-in" aria-label="The Northwind Cipher office">
      <h1 className="sr-only">The office</h1>
      <World
        me={{ handle: p.handle ?? "", name: p.full_name.split(" ")[0] || "Member", avatar: p.avatar, visible: member.privacy?.presence !== "invisible" }}
        flags={flags}
        team={(team as TeamMember[] | null) ?? []}
        desks={(desks as Desk[] | null) ?? []}
        tour={(await searchParams).tour === "1"}
      />
    </section>
  );
}
