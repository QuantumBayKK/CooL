// Team desks and direct messages, in an in-memory Postgres.
import { test } from "node:test";
import assert from "node:assert/strict";
import { communityDb } from "./support/communityDb";

const KAI = "bbbbbbbb-0000-0000-0000-000000000001"; // signs in as the team seat's email
const ADA = "bbbbbbbb-0000-0000-0000-000000000002";
const BO = "bbbbbbbb-0000-0000-0000-000000000003";
const BOB_ID = BO;

async function setup() {
  const t = await communityDb();
  await t.user(KAI, "kailoshkalimuthu@gmail.com", "Kailosh", { google: true });
  await t.user(ADA, "ada@example.com", "Ada");
  await t.user(BO, "bo@example.com", "Bo");
  await t.db.query("update public.profiles set onboarded_at = now(), guidelines_accepted_at = now()");
  await t.db.query("update public.profiles set handle = 'kai' where id = $1", [KAI]);
  await t.db.query("update public.profiles set handle = 'ada' where id = $1", [ADA]);
  await t.db.query("update public.profiles set handle = 'bob' where id = $1", [BO]);
  return t;
}

test("the team list is public, hides emails, and says who has joined", async () => {
  const t = await setup();
  const rows = (await t.as(null, "select * from public.list_team()")).rows;
  assert.deepEqual(rows.map((r) => [r.handle, r.joined, r.member_handle]), [["kailosh", true, "kai"], ["keni", false, null]]);
  assert.ok(!JSON.stringify(rows).includes("@"), "no emails");
  assert.ok((await t.as(ADA, "select * from public.team_seats")).error, "seats table is not readable");
  assert.ok((await t.as(ADA, "select public.set_team_email('keni', 'x@example.com')")).error, "only owners re-point seats");
});

test("anyone can message the team; members are private by default; replies are allowed", async () => {
  const t = await setup();
  assert.equal((await t.as(ADA, "select public.can_message_handle('kai') ok")).rows[0]!.ok, true, "members can message the team");
  assert.equal((await t.as(ADA, "select public.can_message_handle('bob') ok")).rows[0]!.ok, false, "but not other members by default");
  assert.ok((await t.as(ADA, "select public.send_message('bob', 'hi')")).error);
  assert.equal((await t.as(KAI, "select public.can_message_handle('ada') ok")).rows[0]!.ok, true, "the team can reach members");
  await t.as(BO, "update public.profile_privacy set dm_policy = 'anyone' where user_id = $1", [BO]);
  assert.equal((await t.as(ADA, "select public.can_message_handle('bob') ok")).rows[0]!.ok, true, "unless they choose anyone");
  await t.as(KAI, "select public.send_message('ada', 'Welcome to the community!')");
  await t.as(ADA, "update public.profile_privacy set dm_policy = 'nobody' where user_id = $1", [ADA]);
  assert.equal((await t.as(BO, "select public.can_message_handle('ada') ok")).rows[0]!.ok, false, "nobody means nobody");
  assert.equal((await t.as(null, "select public.send_message('kai', 'hello')")).error !== undefined, true, "visitors cannot send");
});

test("conversations, unread counts and reading", async () => {
  const t = await setup();
  await t.as(ADA, "select public.send_message('kai', 'Hello Kailosh!')");
  await t.as(ADA, "select public.send_message('kai', 'Second message')");
  const list = (await t.as(KAI, "select * from public.list_conversations()")).rows;
  assert.equal(list.length, 1);
  assert.equal(list[0]!.handle, "ada");
  assert.equal(list[0]!.unread, 2);
  assert.equal((await t.as(KAI, "select public.unread_messages() n")).rows[0]!.n, 2);
  assert.equal((await t.db.query<{ n: number }>("select count(*)::int n from public.notifications where user_id=$1 and kind='message'", [KAI])).rows[0]!.n, 1, "one notification per conversation");
  const thread = (await t.as(KAI, "select * from public.open_thread('ada')")).rows;
  assert.deepEqual(thread.map((m) => m.body), ["Hello Kailosh!", "Second message"]);
  assert.equal((await t.as(KAI, "select public.unread_messages() n")).rows[0]!.n, 0, "opening marks read");
  assert.equal((await t.as(BO, "select * from public.messages")).rows.length, 0, "others can't read the messages");
  assert.equal((await t.as(BO, "select * from public.open_thread('ada')")).rows.length, 0);
  assert.ok((await t.as(ADA, "insert into public.messages (conversation_id, sender_id, body) select id, $1, 'x' from public.conversations", [ADA])).error, "no direct writes");
});

test("blocking stops messages both ways; limits apply", async () => {
  const t = await setup();
  await t.as(KAI, "select public.set_block('ada', true)");
  assert.ok((await t.as(ADA, "select public.send_message('kai', 'hi')")).error, "blocked");
  assert.ok((await t.as(KAI, "select public.send_message('ada', 'hi')")).error, "blocking works both ways");
  await t.as(KAI, "select public.set_block('ada', false)");
  assert.ok((await t.as(ADA, "select public.send_message('kai', $1)", ["x".repeat(2001)])).error, "length limit");
  for (let i = 0; i < 20; i++) await t.as(ADA, "select public.send_message('kai', 'spam')");
  assert.match((await t.as(ADA, "select public.send_message('kai', 'one more')")).error ?? "", /slow down/);
});

test("desks: one per member, owner-only decoration, validated drawings", async () => {
  const t = await setup();
  assert.ok((await t.as(null, "select * from public.list_desks()")).error, "visitors can't list desks");
  assert.equal((await t.as(ADA, "select public.claim_desk('q1')")).error, undefined);
  assert.ok((await t.as(BOB_ID, "select public.claim_desk('q1')")).error, "a taken desk can't be claimed");
  await t.as(ADA, "select public.claim_desk('q2')");
  const desks = (await t.as(ADA, "select * from public.list_desks()")).rows;
  assert.deepEqual(desks.filter((d) => d.owner_handle).map((d) => d.id), ["q2"], "claiming a new desk frees the old one");
  assert.ok((await t.as(ADA, "select public.decorate_desk(array['star','nope'], '')")).error, "unknown badge");
  assert.ok((await t.as(ADA, "select public.decorate_desk(array['star'], 'x')")).error, "bad drawing");
  assert.equal((await t.as(ADA, "select public.decorate_desk(array['star','code'], $1)", ["7".repeat(60)])).error, undefined);
  assert.ok((await t.as(BOB_ID, "select public.decorate_desk(array['star'], '')")).error, "no desk, no decorating");
  assert.ok((await t.as(ADA, "update public.desks set owner = null")).error, "no direct writes");
});
