// An in-process Postgres (PGlite) with stand-ins for Supabase's `auth` schema and roles, loaded with
// every community migration in order. Lets the database rules be tested without Docker or a network.
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const dir = path.resolve(import.meta.dirname, "../../supabase/community/migrations");

export async function communityDb() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}');
    create table auth.identities (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, provider text, identity_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
    grant usage on schema public, auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant execute on functions to anon, authenticated;
  `);
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(fs.readFileSync(path.join(dir, f), "utf8"));
  }

  /** Runs one statement as a user (or anonymously) inside a transaction; errors become `{ error }`. */
  async function as(uid: string | null, text: string, params: unknown[] = []) {
    await db.exec("begin");
    try {
      await db.exec(uid ? `set local role authenticated; select set_config('request.jwt.claim.sub','${uid}',true);` : "set local role anon;");
      const r = await db.query<Record<string, unknown>>(text, params);
      await db.exec("commit");
      return { rows: r.rows, error: undefined as string | undefined };
    } catch (e) {
      await db.exec("rollback");
      return { rows: [] as Record<string, unknown>[], error: (e as Error).message };
    }
  }

  /** Creates a signed-in user; `google` adds a verified Google identity for that email. */
  async function user(id: string, email: string, name: string, opts: { google?: boolean } = {}) {
    await db.query("insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, $2, now(), $3)", [id, email, { full_name: name }]);
    if (opts.google) {
      await db.query("insert into auth.identities (user_id, provider, identity_data) values ($1, 'google', $2)", [id, { email: email.toLowerCase(), email_verified: true }]);
    }
  }

  return { db, as, user };
}
