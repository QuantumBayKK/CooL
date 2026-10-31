import "server-only";

import { cache } from "react";
import { communityServer } from "./supabase";

/** Feature flags for this request. Missing table or network error means everything stays off. */
export const getFlags = cache(async (): Promise<Record<string, boolean>> => {
  const supabase = await communityServer();
  const { data } = (await supabase?.from("feature_flags").select("key, enabled")) ?? { data: null };
  return Object.fromEntries(((data as { key: string; enabled: boolean }[] | null) ?? []).map((f) => [f.key, f.enabled]));
});

/** The Commons is open when its flag is on; owners can always preview it. */
export async function commonsOpen(owner: boolean) {
  return owner || (await getFlags()).commons === true;
}
