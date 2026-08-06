import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The service-role Supabase client.
 *
 * `server-only` is the first import on purpose: it makes any accidental import
 * of this module from a client component a BUILD error rather than a runtime
 * secret leak. Without it, one careless `import { db } from "@/lib/supabase"`
 * in a `"use client"` file inlines the service-role key into a JavaScript
 * bundle served to the public, and nothing would fail until someone read it.
 *
 * Every portal table has RLS enabled with no policies for `anon` or
 * `authenticated`, so this client is the ONLY path to investor data. That is
 * deliberate: it means access control is expressed once, in server routes that
 * also write the audit entry, rather than being split between a policy and a
 * query where the two can disagree.
 */

let cached: SupabaseClient | null = null;

/** Reads an env var, or throws with a message that says how to fix it. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill it in — ` +
        `run \`supabase status\` for the local values.`,
    );
  }
  return value;
}

export function db(): SupabaseClient {
  if (cached) return cached;

  cached = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        // No session to persist and nothing to refresh: this client is not a
        // user, it is the server. Leaving autoRefresh on schedules a timer in
        // every serverless invocation that never gets to fire.
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: { "x-application": "cool-investor-portal" },
      },
    },
  );

  return cached;
}

/**
 * Whether the portal is configured at all.
 *
 * The public site must build and run without Supabase credentials — a
 * contributor working on the docs should not need a database. Routes that need
 * the portal check this and render a clear "not configured" state instead of
 * throwing a 500 that looks like a bug.
 */
export function portalConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
