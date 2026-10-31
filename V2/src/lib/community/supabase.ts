import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Community accounts live in their own Supabase project, separate from the
 * investor data room. These clients act AS THE SIGNED-IN MEMBER (anon key +
 * their session cookie), so every query is limited by row-level security and
 * the database's own functions. There is no service-role client for the
 * community: nothing here can read more than the member could.
 */

export function communityEnv() {
  const url = process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

/** For Server Components, Server Actions and Route Handlers. */
export async function communityServer() {
  const env = communityEnv();
  if (!env) return null;
  const jar = await cookies();
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        // Server Components cannot set cookies; the middleware refreshes them instead.
        try {
          for (const { name, value, options } of list) jar.set(name, value, options);
        } catch {
          /* called from a Server Component */
        }
      },
    },
  });
}
