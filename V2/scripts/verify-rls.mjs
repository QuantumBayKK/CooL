/**
 * Database security conformance.
 *
 * The site claims three things about the portal's data layer. This script
 * proves each one against a live database rather than asserting it in a README:
 *
 *   1. RLS is enabled AND forced on every portal table, with ZERO permissive
 *      policies. The anon key is public — it ships in every visitor's bundle —
 *      so a leak of it must grant nothing.
 *   2. The audit log is append-only, enforced by trigger. A policy can be
 *      dropped by anyone reaching the database as owner; a trigger makes the
 *      mutation itself raise.
 *   3. The data-room bucket is private.
 *
 * Run: node scripts/verify-rls.mjs
 * Requires: a running database. Uses SUPABASE_DB_URL, or the local default.
 *
 * This is a CI gate, not a smoke test. A regression in any of these is a data
 * breach waiting for someone to notice the anon key.
 */

import { execFileSync } from "node:child_process";

const CONTAINER = process.env.SUPABASE_DB_CONTAINER ?? "supabase_db_V2";

function sql(query) {
  return execFileSync(
    "docker",
    ["exec", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-tAc", query],
    { encoding: "utf8" },
  ).trim();
}

const TABLES = [
  "invite_codes",
  "investor_sessions",
  "audit_log",
  "rate_limits",
  "data_room_assets",
];

let failures = 0;

function check(name, pass, detail = "") {
  if (!pass) failures += 1;
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

console.log("\n  ROW-LEVEL SECURITY");

const rls = sql(`
  select relname, relrowsecurity, relforcerowsecurity
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and relkind = 'r'
   order by relname;
`);

const state = new Map(
  rls
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [name, enabled, forced] = line.split("|");
      return [name, { enabled: enabled === "t", forced: forced === "t" }];
    }),
);

for (const table of TABLES) {
  const row = state.get(table);
  check(`${table} exists`, Boolean(row));
  if (!row) continue;
  check(`${table} RLS enabled`, row.enabled);
  // FORCE matters: without it, the table owner bypasses RLS entirely, and the
  // owner is exactly who a compromised migration runs as.
  check(`${table} RLS forced`, row.forced);
}

console.log("\n  POLICIES");

const policyCount = Number(
  sql(`select count(*) from pg_policies where schemaname = 'public';`),
);
check(
  "zero permissive policies on public schema",
  policyCount === 0,
  `found ${policyCount}`,
);

console.log("\n  APPEND-ONLY AUDIT LOG");

sql(`insert into audit_log (action, subject) values ('admin.login', 'rls-conformance');`);

for (const [op, query] of [
  ["UPDATE", `update audit_log set subject = 'tampered' where subject = 'rls-conformance';`],
  ["DELETE", `delete from audit_log where subject = 'rls-conformance';`],
]) {
  let raised = false;
  try {
    sql(query);
  } catch (err) {
    raised = /append-only/i.test(String(err.stderr ?? err.message ?? err));
  }
  check(`${op} on audit_log is rejected`, raised);
}

console.log("\n  STORAGE");

const bucket = sql(
  `select coalesce((select public::text from storage.buckets where id = 'data-room'), 'missing');`,
);
check("data-room bucket exists", bucket !== "missing");
check("data-room bucket is private", bucket === "false", `public = ${bucket}`);

console.log(
  `\n  ${failures === 0 ? "all database security checks passed" : `${failures} FAILING`}\n`,
);

process.exit(failures ? 1 : 0);
