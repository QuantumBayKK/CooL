// Applies supabase/community/migrations/*.sql to the community database, in order, once each.
//
//   node scripts/community/migrate.mjs           apply pending migrations
//   node scripts/community/migrate.mjs --status  list applied / pending, change nothing
//
// Reads COMMUNITY_DB_URL from the environment or .env.local; never prints it. Each migration runs
// in its own transaction together with its bookkeeping row, so a failure leaves nothing half-done.
// A migration that was edited after being applied is refused (checksum mismatch).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import pg from "pg";

const root = path.resolve(import.meta.dirname, "../..");
const dir = path.join(root, "supabase/community/migrations");

function env(name) {
  if (process.env[name]) return process.env[name];
  const file = path.join(root, ".env.local");
  if (!fs.existsSync(file)) return undefined;
  const line = fs.readFileSync(file, "utf8").split(/\r?\n/).find((l) => l.startsWith(name + "="));
  return line?.slice(name.length + 1).trim();
}

const url = env("COMMUNITY_DB_URL");
if (!url) {
  console.error("COMMUNITY_DB_URL is not set (environment or .env.local).");
  process.exit(1);
}

const files = fs.readdirSync(dir).filter((f) => /^\d{4}_[a-z0-9_]+\.sql$/.test(f)).sort();
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  await client.query(`create table if not exists public.community_migrations (
    name text primary key, checksum text not null, applied_at timestamptz not null default now())`);
  await client.query("alter table public.community_migrations enable row level security");
  await client.query("revoke all on public.community_migrations from anon, authenticated");
  const applied = new Map((await client.query("select name, checksum from public.community_migrations")).rows.map((r) => [r.name, r.checksum]));

  let failed = false;
  for (const name of files) {
    const sql = fs.readFileSync(path.join(dir, name), "utf8");
    const sum = sha(sql);
    if (applied.has(name)) {
      if (applied.get(name) !== sum) {
        console.error(`✗ ${name} was edited after it was applied. Write a new migration instead.`);
        failed = true;
        break;
      }
      if (process.argv.includes("--status")) console.log(`  applied  ${name}`);
      continue;
    }
    if (process.argv.includes("--status")) { console.log(`  pending  ${name}`); continue; }
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into public.community_migrations (name, checksum) values ($1, $2)", [name, sum]);
      await client.query("notify pgrst, 'reload schema'");
      await client.query("commit");
      console.log(`✓ ${name}`);
    } catch (e) {
      await client.query("rollback").catch(() => {});
      const at = e.position ? ` near: ${JSON.stringify(sql.slice(Math.max(0, e.position - 60), Number(e.position) + 30))}` : "";
      console.error(`✗ ${name}: ${e.message}${at}\n  Nothing from this migration was applied.`);
      failed = true;
      break;
    }
  }
  if (failed) process.exitCode = 1;
} finally {
  await client.end();
}
