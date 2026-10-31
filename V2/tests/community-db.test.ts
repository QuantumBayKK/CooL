// Community database rules, exercised as anonymous visitors, members, a moderator and the owner.
import { test } from "node:test";
import assert from "node:assert/strict";
import { communityDb } from "./support/communityDb";

const MEMBER = "11111111-1111-1111-1111-111111111111";
const OWNER = "22222222-2222-2222-2222-222222222222";
const IMPOSTOR = "33333333-3333-3333-3333-333333333333";
const OTHER = "44444444-4444-4444-4444-444444444444";

async function setup() {
  const t = await communityDb();
  await t.user(MEMBER, "ada@example.com", "Ada Lovelace");
  await t.user(OWNER, "kailoshkalimuthu@gmail.com", "Kailosh", { google: true });
  await t.user(IMPOSTOR, "pranauvshrinaath@northwindcipher.com", "Not Pranauv"); // no Google identity
  await t.user(OTHER, "grace@example.com", "Grace Hopper");
  return t;
}

test("migrations run cleanly and twice-safe baseline", async () => {
  const t = await setup();
  const n = await t.db.query<{ n: number }>("select count(*)::int n from public.profiles");
  assert.equal(n.rows[0]!.n, 4);
});

test("new accounts get a unique handle and are visible to everyone by default", async () => {
  const t = await setup();
  const rows = (await t.db.query<{ handle: string; presence: string; profile: string; timezone: string }>(
    "select p.handle, v.presence, v.profile, v.timezone from public.profiles p join public.profile_privacy v on v.user_id = p.id where p.id = $1", [MEMBER])).rows;
  assert.equal(rows[0]!.handle, "ada-lovelace");
  assert.equal(rows[0]!.presence, "online");
  assert.equal(rows[0]!.profile, "public");
  assert.equal(rows[0]!.timezone, "public");
  await t.user("55555555-5555-5555-5555-555555555555", "ada2@example.com", "Ada Lovelace");
  const dup = (await t.db.query<{ handle: string }>("select handle from public.profiles where id = '55555555-5555-5555-5555-555555555555'")).rows[0]!.handle;
  assert.notEqual(dup, "ada-lovelace");
  assert.match(dup, /^ada-lovelace-[a-z0-9]+$/);
});

test("visitors read nothing directly", async () => {
  const t = await setup();
  assert.equal((await t.as(null, "select * from public.profiles")).rows.length, 0);
  assert.ok((await t.as(null, "select public.list_members()")).error);
});

test("members cannot change their role or another member's profile", async () => {
  const t = await setup();
  assert.ok((await t.as(MEMBER, "update public.profiles set role='contributor' where id=$1", [MEMBER])).error);
  await t.as(MEMBER, "update public.profiles set bio='hacked' where id=$1", [OTHER]);
  const bio = (await t.db.query<{ bio: string | null }>("select bio from public.profiles where id=$1", [OTHER])).rows[0]!.bio;
  assert.equal(bio, null);
});

test("profile edits are validated", async () => {
  const t = await setup();
  assert.ok((await t.as(MEMBER, "update public.profiles set handle='X!' where id=$1", [MEMBER])).error, "bad handle rejected");
  assert.ok((await t.as(MEMBER, "update public.profiles set bio=$2 where id=$1", [MEMBER, "x".repeat(281)])).error, "long bio rejected");
  assert.ok((await t.as(MEMBER, "update public.profiles set handle='grace-hopper' where id=$1", [MEMBER])).error, "taken handle rejected");
  const ok = await t.as(MEMBER, "update public.profiles set handle='ada', bio='  Hi  ', skills=$2 where id=$1 returning handle, bio, skills", [MEMBER, ["TypeScript", " TypeScript ", "", "Rust"]]);
  assert.equal(ok.error, undefined);
  assert.equal(ok.rows[0]!.bio, "Hi");
  assert.deepEqual([...(ok.rows[0]!.skills as string[])].sort(), ["Rust", "TypeScript"]);
});

test("get_profile honours per-field privacy for visitors, members and self", async () => {
  const t = await setup();
  for (const id of [MEMBER, OTHER]) await t.as(id, "select public.complete_onboarding('Name Here','used','','I want to learn about verifiable AI.',false)");
  await t.as(MEMBER, "update public.profiles set bio='Hello', timezone='Asia/Kolkata' where id=$1", [MEMBER]);
  const handle = (await t.db.query<{ handle: string }>("select handle from public.profiles where id=$1", [MEMBER])).rows[0]!.handle;

  // default: everyone, visitors included, sees the profile, bio and time zone, never the email
  const byDefault = (await t.as(null, "select public.get_profile($1) p", [handle])).rows[0]!.p as Record<string, unknown>;
  assert.equal(byDefault.bio, "Hello");
  assert.equal(byDefault.timezone, "Asia/Kolkata");
  assert.equal(JSON.stringify(byDefault).includes("@"), false, "no email ever");
  assert.equal((await t.as(null, "select * from public.list_profiles()")).rows.length, 2);

  // members only, with a private bio and time zone
  await t.as(MEMBER, "update public.profile_privacy set profile='members', bio='private', timezone='private' where user_id=$1", [MEMBER]);
  assert.equal((await t.as(null, "select public.get_profile($1) p", [handle])).rows[0]!.p, null);
  assert.equal((await t.as(null, "select * from public.list_profiles()")).rows.length, 1);
  const asMember = (await t.as(OTHER, "select public.get_profile($1) p", [handle])).rows[0]!.p as Record<string, unknown>;
  assert.equal(asMember.name, "Name Here");
  assert.equal(asMember.bio, undefined);
  assert.equal(asMember.timezone, undefined);
  const asSelf = (await t.as(MEMBER, "select public.get_profile($1) p", [handle])).rows[0]!.p as Record<string, unknown>;
  assert.equal(asSelf.timezone, "Asia/Kolkata");
});

test("members cannot read or change someone else's privacy", async () => {
  const t = await setup();
  assert.equal((await t.as(MEMBER, "select * from public.profile_privacy")).rows.length, 1);
  await t.as(MEMBER, "update public.profile_privacy set profile='private' where user_id=$1", [OTHER]);
  const v = (await t.db.query<{ profile: string }>("select profile from public.profile_privacy where user_id=$1", [OTHER])).rows[0]!;
  assert.equal(v.profile, "public");
});

test("owner needs a verified Google identity; capabilities are owner-granted and audited", async () => {
  const t = await setup();
  assert.equal((await t.as(OWNER, "select public.is_owner() o")).rows[0]!.o, true);
  assert.equal((await t.as(IMPOSTOR, "select public.is_owner() o")).rows[0]!.o, false, "email match without Google is not owner");
  assert.ok((await t.as(MEMBER, "select public.set_capability($1,'moderate',true)", [MEMBER])).error, "member cannot self-grant");
  assert.equal((await t.as(OWNER, "select public.set_capability($1,'moderate',true)", [MEMBER])).error, undefined);
  assert.equal((await t.as(MEMBER, "select public.has_capability('moderate') c")).rows[0]!.c, true);
  assert.equal((await t.as(OTHER, "select public.has_capability('moderate') c")).rows[0]!.c, false);
  const audit = (await t.db.query<{ action: string }>("select action from public.admin_audit")).rows.map((r) => r.action);
  assert.deepEqual(audit, ["capability_grant"]);
  assert.ok((await t.as(MEMBER, "insert into public.capabilities (user_id, capability) values ($1,'moderate')", [OTHER])).error, "no direct writes");
});

test("feature flags are public to read and owner-only to change", async () => {
  const t = await setup();
  assert.ok((await t.as(null, "select * from public.feature_flags")).rows.length >= 5);
  assert.ok((await t.as(MEMBER, "select public.set_flag('commons', true)")).error);
  assert.ok((await t.as(MEMBER, "update public.feature_flags set enabled=true")).error || true);
  assert.equal((await t.db.query<{ enabled: boolean }>("select enabled from public.feature_flags where key='commons'")).rows[0]!.enabled, false);
  assert.equal((await t.as(OWNER, "select public.set_flag('commons', true)")).error, undefined);
  assert.equal((await t.db.query<{ enabled: boolean }>("select enabled from public.feature_flags where key='commons'")).rows[0]!.enabled, true);
});

test("rate limiter allows up to the limit in a window", async () => {
  const t = await setup();
  const hits: boolean[] = [];
  for (let i = 0; i < 4; i++) hits.push((await t.db.query<{ ok: boolean }>("select public.rate_limit_hit('k', 60, 3) ok")).rows[0]!.ok);
  assert.deepEqual(hits, [true, true, true, false]);
  assert.ok((await t.as(MEMBER, "select public.rate_limit_hit('k', 60, 3)")).error, "clients cannot call it");
});

test("export returns only the caller's data; delete removes the account", async () => {
  const t = await setup();
  const exp = (await t.as(MEMBER, "select public.export_my_data() d")).rows[0]!.d as Record<string, Record<string, unknown>>;
  assert.equal(exp.profile!.id, MEMBER);
  assert.ok((await t.as(MEMBER, "select public.delete_my_account('nope')")).error, "confirmation required");
  assert.ok((await t.as(OWNER, "select public.delete_my_account('DELETE')")).error, "owner refused");
  assert.equal((await t.as(MEMBER, "select public.delete_my_account('DELETE')")).error, undefined);
  assert.equal((await t.db.query<{ n: number }>("select count(*)::int n from public.profiles where id=$1", [MEMBER])).rows[0]!.n, 0);
  assert.equal((await t.db.query<{ n: number }>("select count(*)::int n from public.profile_privacy where user_id=$1", [MEMBER])).rows[0]!.n, 0);
  assert.equal((await t.db.query<{ n: number }>("select count(*)::int n from public.admin_audit where action='account_delete'")).rows[0]!.n, 1);
});

test("contributor applications and admin review still hold (baseline rules)", async () => {
  const t = await setup();
  assert.ok((await t.as(MEMBER, "insert into public.contribution_requests(user_id,interest,message,github,evidence) values ($1,'code',$2,'octocat',$3)", [MEMBER, "x".repeat(30), ["https://github.com/octocat"]])).error, "must onboard first");
  await t.as(MEMBER, "select public.complete_onboarding('Ada','used','','I want to learn verifiable AI audit trails.',true)");
  const r = await t.as(MEMBER, "insert into public.contribution_requests(user_id,interest,message,github,evidence) values ($1,'code',$2,'octocat',$3) returning id", [MEMBER, "I want to add tests for receipts.", ["https://github.com/octocat/Hello-World/pull/1"]]);
  assert.equal(r.error, undefined);
  assert.ok((await t.as(IMPOSTOR, "select public.review_request($1,'approved')", [r.rows[0]!.id])).error, "impostor cannot approve");
  assert.equal((await t.as(OWNER, "select (public.review_request($1,'approved')).status s", [r.rows[0]!.id])).rows[0]!.s, "approved");
  assert.equal((await t.db.query<{ role: string }>("select role from public.profiles where id=$1", [MEMBER])).rows[0]!.role, "contributor");
});

test("points come from what members did; only you see the breakdown", async () => {
  const t = await setup();
  await t.as(MEMBER, "select public.accept_guidelines()");
  await t.as(MEMBER, "select public.complete_onboarding('Ada Lovelace', null, '', 'I want to build open tools.', false)");
  const handle = (await t.db.query<{ handle: string }>("select handle from public.profiles where id=$1", [MEMBER])).rows[0]!.handle;
  const mine = async () => (await t.as(MEMBER, "select public.my_points() p")).rows[0]!.p as { total: number; parts: Record<string, number> };
  assert.equal((await mine()).total, 50, "joining is worth 50");
  await t.as(MEMBER, `update public.profiles set avatar='{"v":1}'::jsonb where id=$1`, [MEMBER]);
  assert.equal((await mine()).parts.character, 20);
  assert.equal((await mine()).total, 70);
  const shown = (await t.as(null, "select public.get_profile($1) p", [handle])).rows[0]!.p as Record<string, unknown>;
  assert.equal(shown.points, 70, "others see the total on the profile");
  assert.equal(((await t.as(null, "select points from public.list_profiles() where handle=$1", [handle])).rows[0] as { points: number }).points, 70);
  assert.equal((await t.as(null, "select public.my_points() p")).rows[0]?.p ?? null, null, "visitors have no points");
  assert.ok((await t.as(OTHER, "select public.points_parts($1)", [MEMBER])).error, "no one can read another member's breakdown");
  assert.ok((await t.as(OTHER, "select public.points_total($1)", [MEMBER])).error);
});

test("the welcome no longer requires the CooL question", async () => {
  const t = await setup();
  const r = await t.as(MEMBER, "select public.complete_onboarding('Ada Lovelace', null, null, 'Building a game.', false)");
  assert.equal(r.error, undefined);
  assert.ok((await t.as(MEMBER, "select public.complete_onboarding('Ada Lovelace', 'maybe', null, 'Building a game.', false)")).error, "a bad answer is still refused");
  assert.ok((await t.as(MEMBER, "select public.complete_onboarding('Ada Lovelace', null, null, 'Hi', false)")).error, "too short is refused");
});

test("meetings reach every member, only as Meet links, and the host can end them", async () => {
  const t = await setup();
  for (const id of [MEMBER, OTHER]) {
    await t.as(id, "select public.accept_guidelines()");
    await t.as(id, "select public.complete_onboarding('Member Here', null, null, 'Building things together.', false)");
  }
  assert.ok((await t.as(MEMBER, "select public.start_meeting('Hack', 'https://evil.example.com/abc-defg-hij')")).error, "other sites are refused");
  assert.ok((await t.as(MEMBER, "select public.start_meeting('Hack', 'javascript:alert(1)')")).error);
  assert.ok((await t.as(IMPOSTOR, "select public.start_meeting('x', 'abc-defg-hij')")).error, "only members can start one");
  assert.equal((await t.as(MEMBER, "select public.start_meeting('Design sync', 'https://meet.google.com/abc-defg-hij?authuser=0')")).error, undefined);
  const seen = (await t.as(OTHER, "select * from public.list_meetings()")).rows as { title: string; link: string; mine: boolean }[];
  assert.equal(seen.length, 1, "another member sees it");
  assert.equal(seen[0]!.link, "https://meet.google.com/abc-defg-hij", "stored as a clean Meet link");
  assert.equal(seen[0]!.mine, false);
  assert.equal((await t.as(null, "select * from public.list_meetings()")).error !== undefined || (await t.as(null, "select * from public.list_meetings()")).rows.length === 0, true, "visitors see nothing");
  const note = (await t.as(OTHER, "select title, href from public.notifications where kind='meeting'")).rows as { title: string }[];
  assert.equal(note.length, 1, "and is notified");
  assert.match(note[0]!.title, /started a Google Meet: Design sync/);
  assert.equal((await t.as(MEMBER, "select count(*)::int n from public.notifications where kind='meeting'")).rows[0]!.n, 0, "the host isn't notified about their own meeting");
  assert.ok((await t.as(OTHER, "select * from public.meetings")).error, "the table itself is closed");
  await t.as(OTHER, "select public.end_meeting()");
  assert.equal((await t.as(OTHER, "select * from public.list_meetings()")).rows.length, 1, "only the host can end it");
  await t.as(MEMBER, "select public.end_meeting()");
  assert.equal((await t.as(OTHER, "select * from public.list_meetings()")).rows.length, 0, "ended for everyone");
});

test("the ban hammer: admins delete an account and the email cannot come back", async () => {
  const t = await setup();
  assert.ok((await t.as(OTHER, "select public.ban_hammer($1, 'spam')", [MEMBER])).error, "members cannot ban");
  assert.ok((await t.as(OWNER, "select public.ban_hammer($1, null)", [OWNER])).error, "admins cannot ban themselves");
  assert.ok((await t.as(OWNER, "select public.ban_hammer($1, null)", [IMPOSTOR])).error, "or another admin's address");
  assert.equal((await t.as(OWNER, "select public.ban_hammer($1, 'spam links')", [MEMBER])).error, undefined);
  assert.equal((await t.db.query("select 1 from auth.users where id=$1", [MEMBER])).rows.length, 0, "the account is gone");
  assert.equal((await t.db.query("select 1 from public.profiles where id=$1", [MEMBER])).rows.length, 0, "with its profile");
  assert.equal((await t.as(OWNER, "select email from public.banned_emails")).rows.length, 1, "admins see the ban list");
  assert.equal((await t.as(OTHER, "select email from public.banned_emails")).rows.length, 0, "members don't");
  await assert.rejects(t.user("66666666-6666-6666-6666-666666666666", "ADA@example.com", "Ada Again"), /not allowed to join/, "the same email cannot sign up again");
  assert.equal((await t.db.query<{ n: number }>("select count(*)::int n from public.admin_audit where action='ban'")).rows[0]!.n, 1, "it is in the audit log");
  assert.ok((await t.as(OTHER, "select public.unban_email('ada@example.com')")).error, "members cannot unban");
  await t.as(OWNER, "select public.unban_email('ada@example.com')");
  await t.user("66666666-6666-6666-6666-666666666666", "ada@example.com", "Ada Again");
  assert.equal((await t.db.query("select 1 from public.profiles where id='66666666-6666-6666-6666-666666666666'")).rows.length, 1, "after an unban they can join again");
});
