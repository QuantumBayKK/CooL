// The Commons: proposals, lifecycle, comments and the poll engine, exercised in an in-memory Postgres.
import { test } from "node:test";
import assert from "node:assert/strict";
import { communityDb } from "./support/communityDb";

const OWNER = "22222222-2222-2222-2222-222222222222";
const A = "aaaaaaaa-0000-0000-0000-000000000001";
const B = "aaaaaaaa-0000-0000-0000-000000000002";
const C = "aaaaaaaa-0000-0000-0000-000000000003";
const D = "aaaaaaaa-0000-0000-0000-000000000004";
const NEWBIE = "aaaaaaaa-0000-0000-0000-000000000009";

const FIELDS = { problem: "Contributors have no shared place to try ideas.", solution: "A small sandbox repository with templates and CI.", tags: ["sandbox"] };

async function setup() {
  const t = await communityDb();
  await t.user(OWNER, "kailoshkalimuthu@gmail.com", "Kailosh", { google: true });
  for (const [id, name] of [[A, "Ada"], [B, "Bo"], [C, "Cy"], [D, "Di"], [NEWBIE, "New"]] as const) await t.user(id, `${name}@example.com`, name);
  // everyone has finished the welcome steps; all but NEWBIE joined two weeks ago
  await t.db.query("update public.profiles set onboarded_at = now(), guidelines_accepted_at = now(), created_at = now() - interval '14 days' where id <> $1", [NEWBIE]);
  await t.db.query("update public.profiles set onboarded_at = now(), guidelines_accepted_at = now() where id = $1", [NEWBIE]);
  await t.db.query("insert into public.capabilities (user_id, capability) values ($1, 'moderate')", [B]);
  const one = async (uid: string | null, sql: string, params: unknown[] = []) => {
    const r = await t.as(uid, sql, params);
    if (r.error) throw new Error(r.error);
    return r.rows[0]!;
  };
  return { ...t, one };
}

const create = "select public.create_proposal('Sandbox repo', 'A shared sandbox where members can try ideas quickly.', 'devtools', 'tool', true, true, $1::jsonb, true) id";

test("members create proposals that open for discussion; drafts stay private", async () => {
  const t = await setup();
  const { id } = await t.one(A, create, [JSON.stringify(FIELDS)]);
  assert.equal((await t.db.query<{ status: string }>("select status from public.proposals where id=$1", [id])).rows[0]!.status, "discussion");
  const hist = (await t.db.query<{ to_status: string }>("select to_status from public.proposal_status_history where proposal_id=$1 order by id", [id])).rows.map((r) => r.to_status);
  assert.deepEqual(hist, ["draft", "submitted", "discussion"]);
  assert.equal((await t.as(null, "select id from public.proposals")).rows.length, 1, "visitors can read it");

  const draft = await t.one(A, "select public.create_proposal('Draft idea', 'Not ready to share with anyone yet at all.', 'other', 'other', false, false, $1::jsonb, false) id", [JSON.stringify(FIELDS)]);
  assert.equal((await t.as(null, "select id from public.proposals where id=$1", [draft.id])).rows.length, 0, "drafts are hidden from visitors");
  assert.equal((await t.as(C, "select id from public.proposals where id=$1", [draft.id])).rows.length, 0, "and from other members");
});

test("proposal fields and rate limits are enforced", async () => {
  const t = await setup();
  assert.ok((await t.as(A, create, [JSON.stringify({ problem: "short", solution: "short" })])).error, "too-short fields");
  assert.ok((await t.as(A, create, [JSON.stringify({ ...FIELDS, evil: "x" })])).error, "unknown field");
  assert.ok((await t.as(A, create, [JSON.stringify({ ...FIELDS, repo_url: "javascript:alert(1)" })])).error, "bad repo url");
  assert.ok((await t.as(null, create, [JSON.stringify(FIELDS)])).error, "visitors cannot create");
  for (let i = 0; i < 3; i++) await t.one(A, create, [JSON.stringify(FIELDS)]);
  assert.match((await t.as(A, create, [JSON.stringify(FIELDS)])).error ?? "", /3 proposals a day/);
});

test("lifecycle: only the right people make each transition, with reasons recorded", async () => {
  const t = await setup();
  const { id } = await t.one(A, create, [JSON.stringify(FIELDS)]);
  assert.ok((await t.as(C, "select public.transition_proposal($1, 'withdrawn')", [id])).error, "others cannot withdraw it");
  assert.ok((await t.as(A, "select public.transition_proposal($1, 'archived', 'spam spam')", [id])).error, "author cannot archive");
  assert.ok((await t.as(B, "select public.transition_proposal($1, 'revision_requested')", [id])).error, "a reason is required");
  await t.one(B, "select public.transition_proposal($1, 'revision_requested', 'Please describe the MVP scope.')", [id]);
  assert.ok((await t.as(A, "select public.transition_proposal($1, 'passed')", [id])).error, "nobody jumps straight to passed");
  await t.one(A, "select public.transition_proposal($1, 'discussion')", [id]);
  const notes = (await t.db.query<{ user_id: string; kind: string }>("select user_id, kind from public.notifications where kind='proposal.status'")).rows;
  assert.ok(notes.some((n) => n.user_id === A), "the author is notified when a moderator acts");
  assert.ok((await t.as(A, "update public.proposals set status='passed' where id=$1", [id])).error, "no direct writes");
});

test("comments: members post and reply, authors edit, moderators hide with a reason", async () => {
  const t = await setup();
  const { id } = await t.one(A, create, [JSON.stringify(FIELDS)]);
  assert.ok((await t.as(null, "select public.add_comment($1, null, 'hi')", [id])).error, "visitors cannot comment");
  const c1 = await t.one(C, "select public.add_comment($1, null, 'Love this idea') id", [id]);
  const c2 = await t.one(A, "select public.add_comment($1, $2, 'Thanks!') id", [id, c1.id]);
  assert.ok(c2.id);
  assert.ok((await t.as(A, "select public.edit_comment($1, 'changed')", [c1.id])).error, "cannot edit someone else's comment");
  await t.one(C, "select public.edit_comment($1, 'Love this idea, truly')", [c1.id]);
  assert.ok((await t.as(C, "select public.hide_comment($1, 'off topic')", [c2.id])).error, "members cannot hide");
  await t.one(B, "select public.hide_comment($1, 'Off topic for this thread')", [c2.id]);
  const rows = (await t.as(null, "select body, removed from public.proposal_comments_public where proposal_id=$1 order by created_at", [id])).rows;
  assert.deepEqual(rows.map((r) => r.body), ["Love this idea, truly", "[removed by a moderator]"]);
  assert.equal((await t.db.query<{ comment_count: number }>("select comment_count from public.proposals where id=$1", [id])).rows[0]!.comment_count, 2);
  assert.ok((await t.db.query("select 1 from public.notifications where user_id=$1 and kind='proposal.comment'", [A])).rows.length >= 1, "author notified of comments");
});

async function openVote(t: Awaited<ReturnType<typeof setup>>, proposal: unknown, rule = "simple_majority", quorum = 2) {
  const r = await t.one(B, `select public.create_poll('proposal', $1, 'Should Sandbox repo enter incubation?', null, 'yes_no_abstain', true, 'members', '[]'::jsonb,
    now() + interval '2 days', $2, $3, true, 'anonymous', null, 'Owners start incubation if passed') id`, [proposal, quorum, rule]);
  const opts = (await t.db.query<{ id: string }>("select id from public.poll_options where poll_id=$1 order by position", [r.id])).rows.map((o) => o.id);
  return { poll: r.id as string, yes: opts[0]!, no: opts[1]!, abstain: opts[2]! };
}

test("yes/no/abstain vote: eligibility snapshot, one ballot each, private ballots, result moves the proposal", async () => {
  const t = await setup();
  const { id } = await t.one(A, create, [JSON.stringify(FIELDS)]);
  assert.ok((await t.as(C, `select public.create_poll('proposal', $1, 'Should this go ahead now?', null, 'yes_no_abstain', true, 'members', '[]'::jsonb, now() + interval '2 days', 1, 'simple_majority', true, 'anonymous', null, null)`, [id])).error, "members cannot open votes");
  const v = await openVote(t, id);
  assert.equal((await t.db.query<{ status: string }>("select status from public.proposals where id=$1", [id])).rows[0]!.status, "voting_open");

  assert.ok((await t.as(NEWBIE, "select public.cast_ballot($1, array[$2]::uuid[])", [v.poll, v.yes])).error, "new accounts are not eligible");
  await t.one(A, "select public.cast_ballot($1, array[$2]::uuid[])", [v.poll, v.yes]);
  await t.one(C, "select public.cast_ballot($1, array[$2]::uuid[])", [v.poll, v.no]);
  await t.one(C, "select public.cast_ballot($1, array[$2]::uuid[])", [v.poll, v.yes]); // vote change allowed
  await t.one(D, "select public.cast_ballot($1, array[$2]::uuid[])", [v.poll, v.abstain]);
  assert.ok((await t.as(D, "select public.cast_ballot($1, array[$2, $3]::uuid[])", [v.poll, v.yes, v.no])).error, "exactly one choice");
  assert.equal((await t.db.query<{ n: number }>("select count(*)::int n from public.ballots where poll_id=$1", [v.poll])).rows[0]!.n, 3, "one ballot per voter");
  assert.ok((await t.as(A, "select * from public.ballots")).error, "ballots are never readable directly");
  assert.ok((await t.as(OWNER, "select * from public.ballot_choices")).error, "not even by the owner");
  assert.deepEqual((await t.one(C, "select public.my_ballot($1) b", [v.poll])).b, [v.yes], "voters see their own choice");

  assert.ok((await t.as(A, "select public.close_poll($1)", [v.poll])).error, "cannot close early");
  const r = await t.one(OWNER, "select (public.close_poll($1)).*", [v.poll]);
  assert.equal(r.outcome, "passed");
  assert.equal(r.turnout, 3);
  assert.equal((await t.db.query<{ status: string }>("select status from public.proposals where id=$1", [id])).rows[0]!.status, "passed");
  assert.ok((await t.as(A, "select public.cast_ballot($1, array[$2]::uuid[])", [v.poll, v.no])).error, "closed polls take no ballots");
  const again = await t.one(OWNER, "select (public.close_poll($1)).outcome", [v.poll]);
  assert.equal(again.outcome, "passed", "closing twice returns the same result");
  await t.one(OWNER, "select public.transition_proposal($1, 'incubation')", [id]);
  assert.ok((await t.as(B, "select public.transition_proposal($1, 'recruiting')", [id])).error, "only owners advance incubation");
});

test("quorum and the two-thirds rule are applied", async () => {
  const t = await setup();
  const p1 = (await t.one(A, create, [JSON.stringify(FIELDS)])).id;
  const v1 = await openVote(t, p1, "simple_majority", 3);
  await t.one(A, "select public.cast_ballot($1, array[$2]::uuid[])", [v1.poll, v1.yes]);
  assert.equal((await t.one(OWNER, "select (public.close_poll($1)).outcome", [v1.poll])).outcome, "quorum_not_met");
  assert.equal((await t.db.query<{ status: string }>("select status from public.proposals where id=$1", [p1])).rows[0]!.status, "not_passed");

  const p2 = (await t.one(A, create, [JSON.stringify(FIELDS)])).id;
  const v2 = await openVote(t, p2, "two_thirds", 1);
  await t.one(A, "select public.cast_ballot($1, array[$2]::uuid[])", [v2.poll, v2.yes]);
  await t.one(C, "select public.cast_ballot($1, array[$2]::uuid[])", [v2.poll, v2.no]);
  assert.equal((await t.one(OWNER, "select (public.close_poll($1)).outcome", [v2.poll])).outcome, "not_passed", "1 of 2 is not two thirds");
});

test("a material edit during a vote voids it publicly and returns the proposal to discussion", async () => {
  const t = await setup();
  const { id } = await t.one(A, create, [JSON.stringify(FIELDS)]);
  const v = await openVote(t, id);
  assert.ok((await t.as(A, "select public.edit_proposal($1, 'Sandbox repo', 'A shared sandbox where members can try ideas quickly.', $2::jsonb, false, null)", [id, JSON.stringify(FIELDS)])).error, "minor edits are refused during a vote");
  const ver = await t.one(A, "select public.edit_proposal($1, 'Sandbox repo v2', 'A shared sandbox where members can try ideas quickly.', $2::jsonb, true, 'Changed scope') v", [id, JSON.stringify({ ...FIELDS, scope_mvp: "Templates only" })]);
  assert.equal(ver.v, 2);
  const poll = (await t.db.query<{ status: string; invalidated_reason: string }>("select status, invalidated_reason from public.polls where id=$1", [v.poll])).rows[0]!;
  assert.equal(poll.status, "invalidated");
  assert.match(poll.invalidated_reason, /changed materially/);
  assert.equal((await t.db.query<{ status: string }>("select status from public.proposals where id=$1", [id])).rows[0]!.status, "discussion");
  assert.equal((await t.db.query<{ n: number }>("select count(*)::int n from public.proposal_versions where proposal_id=$1", [id])).rows[0]!.n, 2, "both versions kept");
});

test("ranked choice uses instant-runoff", async () => {
  const t = await setup();
  const poll = (await t.one(OWNER, `select public.create_poll('community', null, 'Which project should we start next?', null, 'ranked', true, 'members',
    '[{"label":"Alpha"},{"label":"Beta"},{"label":"Gamma"}]'::jsonb, now() + interval '1 day', 0, 'plurality', false, 'public', null, null, 0) id`)).id;
  const [alpha, beta, gamma] = (await t.db.query<{ id: string }>("select id from public.poll_options where poll_id=$1 order by position", [poll])).rows.map((o) => o.id);
  // first preferences: Alpha 2, Beta 2, Gamma 1. Gamma is eliminated; its voter prefers Beta next → Beta wins 3–2.
  for (const [voter, order] of [[A, [alpha, beta]], [B, [alpha, gamma]], [C, [beta, alpha]], [D, [beta]], [OWNER, [gamma, beta, alpha]]] as const) {
    await t.one(voter, "select public.cast_ballot($1, $2::uuid[])", [poll, order]);
  }
  assert.ok((await t.as(A, "select public.cast_ballot($1, $2::uuid[])", [poll, [beta]])).error, "this poll does not allow changing votes");
  const r = await t.one(OWNER, "select (public.close_poll($1)).*", [poll]);
  assert.equal(r.outcome, "winner");
  assert.equal(r.winner, beta);
  assert.equal((r.rounds as unknown[]).length, 2);
  assert.equal((await t.as(null, "select * from public.poll_voters($1)", [poll])).rows.length, 5, "public poll lists voters after closing");
});

test("owners can invalidate an open poll with a public reason, never edit it", async () => {
  const t = await setup();
  const { id } = await t.one(A, create, [JSON.stringify(FIELDS)]);
  const v = await openVote(t, id);
  assert.ok((await t.as(B, "select public.invalidate_poll($1, 'moderators cannot do this')", [v.poll])).error);
  assert.ok((await t.as(OWNER, "select public.invalidate_poll($1, 'short')", [v.poll])).error, "needs a real reason");
  await t.one(OWNER, "select public.invalidate_poll($1, 'Eligibility list was wrong; reopening tomorrow.')", [v.poll]);
  const audit = (await t.as(null, "select action, note from public.poll_audit where poll_id=$1 order by id", [v.poll])).rows;
  assert.deepEqual(audit.map((a) => a.action), ["opened", "invalidated"]);
  assert.ok((await t.as(OWNER, "update public.polls set question='rigged' where id=$1", [v.poll])).error, "no direct edits");
});

test("visitors can read comments through the public view", async () => {
  const t = await setup();
  const { id } = await t.one(A, create, [JSON.stringify(FIELDS)]);
  await t.one(C, "select public.add_comment($1, null, 'Visible to everyone')", [id]);
  const rows = (await t.as(null, "select body, author_id from public.proposal_comments_public where proposal_id=$1", [id])).rows;
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.body, "Visible to everyone");
  assert.equal((await t.as(null, "select * from public.comment_authors($1)", [id])).rows.length, 2, "author names come from the safe function");
});
