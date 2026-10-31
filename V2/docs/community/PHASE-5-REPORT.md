# Phase 5 report: The Commons

Date: 31 October 2026. Built ahead of Phases 2–4 because it is the spec's central pillar and needs no outside accounts. Local and uncommitted.

## Implemented and verified

| Area | What exists |
| --- | --- |
| Proposals | Every §13 field. Drafts are private. Submitting opens discussion. Category, type, solo/team and beginner-friendly flags, tags. Rate limit: 3 per member per day. |
| Versions | Every edit creates an immutable version, and any version can be viewed. A material edit during an open vote voids the vote with a public reason and returns the proposal to discussion. |
| Lifecycle | The full §13 lifecycle, enforced by a transition table that says who may make each move (author, moderator, owner, system). Every move is in the public decision history, and the author and followers are notified. |
| Discussion | Threaded comments: reply, edit, delete; moderators remove with a reason (audited). Followers. Visitors read; members post (rate-limited). |
| Poll engine | Single, multiple (with a maximum), yes/no/abstain, ranked choice (instant runoff, published tie rule and rounds), and advisory interest polls. |
| Poll rules | Binding vs advisory. Eligibility (members / contributors / followers, minimum account age) frozen when the poll opens. Quorum. Simple-majority or two-thirds pass rules. A vote-change policy. Anonymous ballots, or a public list of who voted after closing (never their choices). Decision owner and next step. Every rule is shown before voting. |
| Integrity | One ballot per voter, enforced by a unique constraint plus a row lock. Ballots are unreadable by anyone, owners included; voters see only their own. Totals are hidden until close. Results are computed server-side, once. Owners can only **invalidate** a poll, with a public reason, never edit one. Public audit trail. |
| Closing | Due polls close automatically on the next page view (`close_due_polls`). Owners can close early. The result moves the proposal to passed or not passed and notifies voters. |
| Pages | `/community/commons` (voting chamber, idea wall, incubator, showcase, recent decisions, archive link), `/community/proposals` (search, category, stage, sort, beginner filter, my drafts), `/community/proposals/new`, `/community/proposals/[id]`, `/community/proposals/[id]/edit`, `/community/polls/[id]`, `/community/polls/new` (owners). |
| Notifications | In-app notification records for status changes, comments, opened and closed votes. The inbox page that lists them arrives in Phase 7. |

**Tests:**
- `tests/community-commons.test.ts`: 10 suites against the real migrations (lifecycle permissions, field validation, rate limits, comments and moderation, eligibility snapshot, one ballot per voter, private ballots, quorum, two-thirds, material-edit invalidation, ranked-choice runoff, owner invalidation, visitor comment reading).
- Live browser test: **26 / 26**. A member proposes, another comments and follows, a moderator opens the vote, two members vote, totals stay hidden, the owner closes, the result is Passed, incubation starts, the full history is recorded, a visitor reads everything, no sideways scroll on phones, no page errors.
- Full suite: 113 tests, 112 pass (1 pre-existing skip). Typecheck, lint (0 errors) and build pass.

**Defect found and fixed:** visitors couldn't read comments, because the comment view joined a table they can't read. Fixed in migration `0004`.

## Switched off until you decide

The `commons` feature flag is **off**. Owners can already use everything; members see "Opening soon". Turn it on in **Admin → Features**.

## Not done yet

- Recruitment board and team formation for incubated projects need the database-backed project model from Phase 4.
- Kickoff scheduling needs Phase 6.
- Spam/duplicate *detection* is manual: moderators archive with a reason. There's no automatic similarity check yet.
- The notification inbox page arrives in Phase 7.
