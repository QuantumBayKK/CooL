import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { communityServer } from "./supabase";

export type Role = "member" | "contributor";
export type Visibility = "public" | "members" | "private";
export type Presence = "invisible" | "online" | "room" | "project" | "availability";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  handle: string | null;
  avatar_url: string | null;
  avatar: unknown;
  role: Role;
  bio: string | null;
  timezone: string | null;
  skills: string[];
  onboarded_at: string | null;
  guidelines_accepted_at: string | null;
  tried_cool: "used" | "read" | "not_yet" | null;
  cool_usage: string | null;
  join_reason: string | null;
  show_in_directory: boolean;
  created_at: string;
};

export type Privacy = {
  profile: Visibility;
  bio: Visibility;
  skills: Visibility;
  timezone: Visibility;
  presence: Presence;
  show_last_active: boolean;
  dm_policy: "anyone" | "shared_project" | "nobody";
};

export type Member = {
  id: string;
  email: string;
  providers: string[];
  profile: Profile | null;
  privacy: Privacy | null;
  owner: boolean;
  moderator: boolean;
};

/**
 * The signed-in member for this request, or null. `getUser()` validates the session with the auth
 * server rather than trusting the cookie's contents. Cached per request.
 */
export const getMember = cache(async (): Promise<Member | null> => {
  const supabase = await communityServer();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const [profile, privacy, owner, moderator] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("profile_privacy").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.rpc("is_owner"),
    supabase.rpc("has_capability", { p_cap: "moderate" }),
  ]);
  return {
    id: user.id,
    email: user.email ?? "",
    providers: (user.identities ?? []).map((i) => i.provider),
    profile: (profile.data as Profile | null) ?? null,
    privacy: (privacy.data as Privacy | null) ?? null,
    owner: owner.data === true,
    moderator: moderator.data === true,
  };
});

/** Is the community backend configured for this deployment? */
export function communityConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_URL && process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_ANON_KEY);
}

/** True once the member has finished the welcome steps (answers saved and guidelines accepted). */
export function isWelcomed(m: Member | null) {
  return Boolean(m?.profile?.onboarded_at && m.profile.guidelines_accepted_at);
}

/**
 * For pages that need a signed-in member. Visitors go to sign in; members who have not finished the
 * welcome steps go there first. `path` is where to come back to.
 */
export async function requireMember(path: string, opts: { welcomed?: boolean } = { welcomed: true }): Promise<Member> {
  const m = await getMember();
  if (!m) redirect(`/community/login?next=${encodeURIComponent(path)}`);
  if (opts.welcomed !== false && !isWelcomed(m)) redirect(`/community/welcome?next=${encodeURIComponent(path)}`);
  return m;
}
