"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** The signed-in member's client in the browser. Limited by row-level security like any visitor. */
export function communityBrowser(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client = createBrowserClient(url, key);
  return client;
}
