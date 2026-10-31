import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

/**
 * Refreshes a community member's session in middleware, so pages always see a valid one
 * (Server Components cannot write cookies). Kept free of `next/headers` so the middleware
 * bundle can import it. Returns the cookies to copy onto the outgoing response.
 */
export async function refreshCommunitySession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_ANON_KEY;
  const updates: { name: string; value: string; options: CookieOptions }[] = [];
  if (!url || !key) return updates;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          request.cookies.set(name, value);
          updates.push({ name, value, options });
        }
      },
    },
  });
  await supabase.auth.getUser();
  return updates;
}
