# Community rebuild — plan, cost register, risks

Status: **proposal, awaiting owner approval.** Per §37, no destructive rewrite starts before approval.

## 1. Phases, in dependency order

Each phase ends with typecheck, lint, tests and build green; a report of what is real, mocked or remaining; and screenshots of working interactions (§37). Incomplete systems ship behind `feature_flags`.

### Phase 1 — Foundation
- Fix `npm run lint` (ESLint CLI; `next lint` no longer exists).
- Add the `(community)` route group, layout, navigation and design tokens shared with the main site (black, silver type, glass, Doto accents), plus a Community link on the home page.
- Move the community schema into versioned migrations (`0001_baseline` = today's live schema), add CI RLS tests, and move the 44 database checks into the repo.
- Auth: Supabase SSR cookies in Next; Google plus GitHub providers with manual linking; a validated return path; re-auth for linking.
- Capabilities model (`platform_roles`, `capabilities`, `can()`), replacing `admins`.
- Profiles with per-field privacy, settings page, guidelines acceptance, export (JSON download) and self-serve deletion.
- Feature flags, structured logging (no PII), error tracking (free tier, to be confirmed).
- `/community/directory` list mode.
- Rotate the leaked service key and database password.

**Acceptance:**
- A visitor browses public pages.
- A member signs in with Google, links GitHub, sets privacy, exports and deletes their account.
- The owner is recognised only through a verified Google identity.
- RLS tests prove a member cannot read another member's private fields.

### Phase 2 — Original art and playable world (single-player)
- Art bible:
  - palette (warm interior light on a deep night exterior, so it reads on the black site);
  - 16 px grid at integer scales, ¾ top-down perspective, light from the top-left;
  - character proportions and an outline rule;
  - an interaction-highlight rule.
- Pipeline: `.aseprite` sources → `scripts/world/export.mjs` (Aseprite CLI, deterministic) → atlases + `manifest.json` → sprite-sheet validation test → visual-regression screenshots.
- **Playable prototype first:** the lobby only, built with original placeholder-free tiles. The owner approves scale and style before mass production (§36).
- Then: The Commons, the meeting hall, the project district entrance, the quiet area and the help desk.
- Engine: port the Pixi renderer; fixed-step grid movement; collision from map data; camera (integer zoom, follow, reduced-motion snap); keyboard, click-to-walk and touch joystick; interactables with range checks that open in-place panels deep-linked to web pages.
- Avatar: extend the procedural characters with sit, work and wave animations.
- Remove LimeZu from the build.

**Acceptance:**
- Every interactable is reachable by keyboard and listed in the directory.
- 60 fps on a mid-range laptop and at least 30 fps on a mid-range phone, measured and recorded.
- No asset in the build lacks a manifest row.

### Phase 3 — Multiplayer
- A Worker with one Durable Object per room instance, hibernatable WebSockets, the join tokens and protocol v1 from `01-ARCHITECTURE.md`, capacity, reconnect, rate limits and presence modes.
- Load-test 100 synthetic clients across 3 instances.

**Acceptance:**
- No duplicate avatars on reconnect.
- Capacity is never exceeded.
- Spoofed room IDs and replayed tokens are rejected.
- Invisible members are not revealed.
- The load-test report lists the measured messages, duration and cost.

### Phase 4 — Projects and GitHub
- Project directory and rooms, recruitment, applications and follows.
- A GitHub App for the CooL repository: webhooks (raw-body HMAC-SHA256, constant-time compare, delivery deduplication), outbox jobs, and nightly reconciliation through a Vercel cron.
- Read models and workstation terminals; contribution evidence.

**Acceptance:**
- Forged and replayed webhooks are rejected.
- A missed event is repaired by reconciliation.
- A merged PR creates evidence for the linked GitHub identity only.

### Phase 5 — The Commons
- Proposals with versions and the full lifecycle (§13).
- Threaded comments, the review actions, the poll engine (all §14 types; ranked choice uses instant-runoff tallying with published tie rules), eligibility snapshots, anonymous ballots, close-and-publish, decision records, and incubation → recruiting → active project.

**Acceptance:**
- One ballot per voter, enforced by the database under concurrent submissions (tested).
- No view exposes anonymous choices.
- A material edit during voting pauses the poll with a public notice.
- The end-to-end test runs proposal → vote → incubation → recruit → project room.

### Phase 6 — Calendar and meetings
- Scheduling polls (time-zone and daylight-saving correct, ICS export), events with RSVP and waitlist.
- Google connection (narrowest scope — see risk R6), encrypted refresh tokens, `events.insert` with `conferenceData.createRequest` (`hangoutsMeet`, unique `requestId`, `conferenceDataVersion=1`), pending/ready/failed handling, idempotent retry with reconcile-before-create, and in-app invites.

**Acceptance:**
- The end-to-end test runs schedule poll → confirm → meeting → a real Meet URL against a test Google account.
- No URL is ever shown before Google returns one.

### Phase 7 — Communication and community
- Room, project and direct chat, notifications, blocks and mutes, reports.
- Moderation queue with appeals.
- Cosmetics earned from verified evidence, showcase gallery, onboarding polish.

### Phase 8 — Launch hardening
- Security review against §29, accessibility audit, backup/restore drill, runbooks, staging environment, rollback rehearsal and cost alerts.

## 2. Cost register (verified 31 Oct 2026; re-check before each provisioning)

Currency assumption: about ₹85 per US$ (pre-tax; GST is extra).

| Service | Plan | Monthly | Limits that matter | Source |
| --- | --- | --- | --- | --- |
| Vercel (`cool` project) | Hobby is **non-commercial only**; Pro is $20 per developer seat | ₹0 / ~₹1,700 | Hobby: 1M function invocations, 100 GB transfer, 4 CPU-hours | vercel.com/docs/plans/hobby |
| Supabase (community project) | Free | ₹0 | 500 MB DB, 5 GB egress, 50k MAU, **pauses after 1 week idle**, **no backups**, 2 active projects | supabase.com/pricing |
| Supabase Pro (if backups needed) | Pro | ~₹2,125 | Daily backups for 7 days; spend cap on by default | supabase.com/pricing |
| Cloudflare Workers + Durable Objects | Free | ₹0 | 100k requests/day, 13k GB-s/day, 5 GB SQLite, WebSocket messages billed 20:1 | developers.cloudflare.com/durable-objects/platform/pricing |
| Cloudflare Workers Paid (fallback) | Paid | ~₹425 minimum | 1M requests + 400k GB-s included | same |
| GitHub App, Google Calendar API | — | ₹0 | API rate limits only | — |
| Backups (our own) | GitHub Actions nightly `pg_dump` to a private, encrypted artefact | ₹0 | Retention bound by the free artefact storage | to verify |

**Gap to report (§32):**
- If the company site must move to Vercel Pro for commercial use, that alone is about ₹1,700 per month.
- Adding Workers Paid makes it about ₹2,125, **over the ₹2,000 cap**.
- Supabase Pro backups alone also exceed the cap.

Options:
- **(a)** Vercel Pro + Workers Free + Supabase Free with our own nightly backups: about ₹1,700, within the cap.
- **(b)** Raise the cap.
- **(c)** Move hosting off Vercel (for example Cloudflare Pages): a production change that needs approval.

**Recommendation: (a).** Workers Paid is enabled only if the load test proves Free is insufficient, and only with approval.

**Realtime usage estimate (to be replaced by load-test numbers):**
- Movement is sent only on tile steps (≈ 3/s while walking; ~0.5/s averaged per connected user).
- At 100 users for 4 peak hours, that's ≈ 720k incoming messages/day, or ≈ 36k billable requests/day.
- That's within the Free tier's 100k/day before connection and API overhead.
- Duration depends on hibernation and must be measured.

## 3. Risk register

| # | Risk | Likelihood / impact | Mitigation |
| --- | --- | --- | --- |
| R1 | **Original art capacity.** A "richly detailed" world needs a pixel artist; generated or procedural art may not reach that bar. | High / High | Approve the art bible and the lobby prototype first. Budget an artist (owner decision), or accept a simpler original style. |
| R2 | Vercel Hobby used commercially | High / Medium | Decide the plan (cost register options). |
| R3 | Supabase free tier: no backups; pauses when idle | Medium / High | Nightly `pg_dump` to encrypted storage; restore drill in Phase 8; a scheduled ping is not a fix for real inactivity. |
| R4 | Durable Object free limits exceeded at peak | Medium / Medium | Tile-step movement, 10 Hz batched broadcast, hibernation, load test; Workers Paid with approval. |
| R5 | Leaked service key and database password from chat | Certain / High | Rotate in Phase 1 before anything is deployed. |
| R6 | **Google Calendar scope verification.** Calendar scopes are classed as sensitive (third-party source; confirm in the Google Cloud console). That needs brand verification, scope justification and a demo video. Until verified, sign-in is limited to test users. | High / Medium | Prefer `calendar.app.created` (events only on an app-created calendar). Start verification early in Phase 6. |
| R7 | Two codebases during migration (standalone community still live) | Medium / Medium | Freeze features on the standalone site; redirect it once `/community` reaches parity. |
| R8 | Next 16 `middleware` → `proxy` rename touches production CSP and routing | Low / High | Separate, approved change with before/after header checks. |
| R9 | Vote manipulation by sock-puppets | Medium / High | Eligibility snapshots at poll open, minimum account age, and GitHub-linked eligibility for binding polls (published policy). |
| R10 | Scope: the spec is many months of work | High / High | Phase gates, flags, and shipping each phase's web features before its world features. |
| R11 | Pre-existing uncommitted work on `redesign/matte` | Medium / Medium | Agree a base branch before Phase 1. |

## 4. Decisions needed from the owner before Phase 1

1. Vercel plan and cost option (a), (b) or (c).
2. Base branch for community work in `QuantumBayKK/CooL`.
3. Art production: commission a pixel artist, or have the agent produce original art (procedural and hand-authored) with lower detail.
4. Keep the community and investor data in separate Supabase projects (recommended).
5. Approval of this plan, the data model and the permission matrix.
