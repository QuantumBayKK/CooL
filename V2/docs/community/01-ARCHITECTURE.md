# Community rebuild — architecture

Status: **proposal, awaiting owner approval.** Nothing here is built yet.

## 1. Shape of the system

```text
Browser
 ├─ Next.js pages under /community (React 19, server components where possible)
 │    └─ World client (Pixi v8, client-only, lazy loaded)  ──WebSocket──┐
 │                                                                     │
 ├─ Next.js server (Vercel project "cool")                             │
 │    ├─ route handlers / server actions  → domain modules → Postgres  │
 │    ├─ issues short-lived room-join tokens (jose, ES256)             │
 │    ├─ GitHub App webhooks (raw-body HMAC)                           │
 │    └─ Google Calendar calls (server-held encrypted tokens)          │
 │                                                                     │
 ├─ Supabase project "community" (Postgres + Auth: Google, GitHub)     │
 │                                                                     ▼
 └─ Cloudflare Worker + Durable Objects (one object per room instance)
        authoritative movement, capacity, presence, room chat fan-out
        verifies join token; persists nothing but room chat it forwards
        to the Next API for durable storage
```

Durable data lives only in Postgres. The realtime service holds ephemeral state (positions, who is in the room) and can restart without data loss (§10, §31).

## 2. Decision records

**ADR-1: Host inside the company site.** Routes live in `src/app/(community)/community/**` with their own layout and navigation; the site header links to them. The static `public/index.html` home page gains a Community link.

**ADR-2: Pixi v8, not Phaser.** Owner decision. Pixi is a renderer, not a game framework, so we own the small game layer: fixed-step simulation, tile collision, camera, input, scene lifecycle. The existing `Character`, `Camera` and `TiledMapRenderer` already cover most of it. Physics engines are not needed (grid movement).

**ADR-3: Grid movement, 4-direction, server-validated.** One tile per step at a fixed speed, no diagonals (removes diagonal speed exploits, §09). The client predicts and the server reconciles: it accepts a step only if adjacent, walkable, not faster than the speed limit and in sequence.

**ADR-4: Separate Supabase project for the community.** It keeps the existing project `qchsjjyknzrcddjhshzk`. Investor data stays in the main site's project. Next uses `@supabase/ssr` with httpOnly cookies, so protected actions are validated server-side (§26). RLS stays on as defence in depth.

**ADR-5: Identity = Supabase Auth with Google and GitHub, manual linking enabled.** Linking a second provider requires a fresh sign-in (re-authentication, §26). The GitHub *identity* link (who you are) is separate from the GitHub *App* installation (repository access, §19).

**ADR-6: Realtime on Cloudflare Durable Objects (Workers Free first).** Verified 31 Oct 2026: DOs are on the Free plan (SQLite backend), with 100,000 requests/day and 13,000 GB-s/day; incoming WebSocket messages are billed 20:1. Supabase Realtime's free tier (200 connections, 2M messages/month) would be exhausted by movement fan-out for 100 users. The hibernatable WebSocket API keeps duration charges low. Fallback is Workers Paid ($5/month minimum) — see the cost register.

**ADR-7: Domain modules, not framework handlers.** Domain logic lives in `src/server/community/<module>/` (pure functions + repository interfaces), with zod schemas at every boundary. Handlers in `src/app/api/community/**` are thin. A typed error envelope is used throughout: `{ error: { code, message, retryAfter? } }`.

**ADR-8: Original art pipeline.** Source files (`.aseprite`) live in `assets/world/source/`. A deterministic export script produces atlases plus `assets/world/manifest.json` (file, author, licence, frame size, anchors, collision). Tile grid: 16 px, rendered at integer scales. Details in `03-PLAN-COSTS-RISKS.md`, Phase 2.

**ADR-9: Feature flags in a database table** (`feature_flags`), read server-side. Incomplete systems ship dark.

## 3. Routes

| Route | Access | Purpose | World equivalent |
| --- | --- | --- | --- |
| `/community` | public | Home, what's happening, enter the world | Lobby |
| `/community/world` | members (visitors see a preview) | Immersive HQ; `?room=` deep links | — |
| `/community/directory` | public | List mode of every room and interactable (accessibility, §06/§30) | All districts |
| `/community/projects`, `/[slug]` | public read | Directory, detail, issues, roadmap, recruitment, join | Project district, project rooms |
| `/community/commons` | public read | Commons hub | The Commons |
| `/community/proposals`, `/[id]` | public read, member write | Idea board, discussion, versions, decision record | Idea Wall |
| `/community/polls/[id]` | per poll eligibility | Ballot, rules, results | Voting Chamber |
| `/community/calendar` | public read | Events, availability polls, confirmed meetings | Community Calendar |
| `/community/events/[id]` | per event | Detail, RSVP, waitlist | Event space |
| `/community/meetings/[id]` | per access policy | Meeting state and Meet link | Meeting hall |
| `/community/contributors/[handle]` | privacy-aware | Profile | — |
| `/community/inbox` | member | DMs, team messages, notifications | — |
| `/community/settings` | member | Profile, privacy, presence, notifications, connected accounts, export/delete | — |
| `/community/guidelines`, `/privacy`, `/terms` | public | Policies | Help desk |
| `/community/moderation` | moderator capability | Queue, actions, appeals | — |
| `/community/admin` | owner | Configuration, flags, cost register, audit | — |
| `/community/login`, `/welcome` | public / new member | Sign-in, onboarding (guidelines acceptance, profile, avatar) | — |

Return paths after sign-in go through the existing `safeReturnPath` rule, ported: same-origin only, under `/community`, with no protocol-relative or backslash forms.

## 4. Roles and capabilities (§23)

Base role per member: `visitor` (not signed in) · `contributor` (any signed-in member) · `maintainer` (scoped per project) · `owner` (platform). `moderator` is a separate capability grant. Checks go through `can(actor, capability, object)` in one module, never by comparing role names in the UI.

| Capability | Visitor | Contributor | Maintainer (own project) | Moderator | Owner |
| --- | :-: | :-: | :-: | :-: | :-: |
| Read public projects, proposals, polls, events, profiles | ✓ | ✓ | ✓ | ✓ | ✓ |
| Enter world / public rooms | — | ✓ | ✓ | ✓ | ✓ |
| Enter private project/team room | — | if member | ✓ | for reports only | ✓ |
| Submit proposal, comment | — | ✓ (rate-limited) | ✓ | ✓ | ✓ |
| Edit own proposal (allowed states) | — | author | author | — | — |
| Request revision, merge duplicate, mark spam, close with reason | — | — | — | ✓ | ✓ |
| Open a binding community poll | — | — | — | — | ✓ |
| Open a project poll | — | — | ✓ | — | ✓ |
| Vote | — | if eligible | if eligible | if eligible | if eligible |
| Edit or delete ballots | — | — | — | — | — (never) |
| Invalidate a poll (with public record) | — | — | — | — | ✓ |
| Create scheduling poll | — | ✓ | ✓ | ✓ | ✓ |
| Create meeting (needs own Google connection) | — | ✓ | ✓ | ✓ | ✓ |
| Create event | — | per config | ✓ | ✓ | ✓ |
| Manage project: recruitment, invites, accept applications | — | — | ✓ | — | ✓ |
| Link repository / install GitHub App | — | — | ✓ (+ GitHub admin rights) | — | ✓ |
| Send DM | — | if recipient allows | ✓ | ✓ | ✓ |
| Report, block, mute | — | ✓ | ✓ | ✓ | ✓ |
| Act on reports (warn, remove, restrict, suspend) | — | — | — | ✓ | ✓ |
| Read moderation evidence | — | — | — | assigned cases | ✓ |
| Grant maintainer / moderator, feature flags, cost register | — | — | — | — | ✓ |

Owner status keeps today's rule: the email must be on an allowlist **and** proven by a verified Google identity.

## 5. Realtime protocol v1 (§11)

Envelope, both directions: `{ v: 1, type, id (ulid), seq, ts, payload }`. Unknown `v` causes the connection to close with code 4400. Every payload has a zod schema shared by client, Worker and tests.

**Join flow.** Next checks the member's session, room access, ban state and capacity. It then issues a 60-second ES256 token `{ sub, room, instance, caps, jti }`. The Worker verifies it with the public key, rejects a reused `jti`, and reserves a seat atomically inside the Durable Object. Clients never choose an instance ID; Next assigns one.

| Message | Dir | Auth | Rate limit | Persisted | Idempotency | Failure reply |
| --- | --- | --- | --- | --- | --- | --- |
| `room.join` | C→S | join token | 1 / 2 s | no | `jti` | `room.denied {reason: full\|forbidden\|expired}` |
| `room.leave` | C→S | session | — | no | — | — |
| `avatar.move {dir, seq}` | C→S | member of room | 8 / s, burst 12 | no | `seq` monotonic | `avatar.state` correction |
| `avatar.interact {objectId}` | C→S | member + range check | 4 / s | audit only for privileged objects | `id` | `interaction.result {ok:false, code}` |
| `presence.update {mode, status}` | C→S | self | 1 / 5 s | preference only, via API | — | `error` |
| `chat.send {text}` | C→S | member, not muted/blocked | 1 / s, 20 / min | yes (forwarded to the API, then echoed) | `id` | `error {code: rate_limited\|blocked}` |
| `emote {name}` | C→S | member | 1 / 2 s | no | — | — |
| `room.snapshot` | S→C | — | on join / reconnect | — | — | — |
| `room.member.joined/left` | S→C | filtered by presence privacy | — | — | — | — |
| `avatar.state {userId, x, y, dir, anim}` | S→C | — | batched at 10 Hz | — | — | — |
| `chat.message` | S→C | — | — | — | `id` | — |
| `notification.created`, `poll.*`, `proposal.updated`, `meeting.status`, `project.activity.updated`, `moderation.action` | S→C | targeted | — | source of truth is the API | `id` | — |

Non-room events (polls, proposals, meetings, notifications) are pushed by the Next server to the right rooms through an authenticated internal endpoint on the Worker. The durable record is always written to Postgres first.

**Reconnect.** The client keeps a 5-minute reconnect token. The server restores room membership if the seat is still held (30 s grace), and positions go back to the last validated tile or the room spawn. A second connection for the same user replaces the first, so avatars are never duplicated.

**Presence privacy.** Modes: `invisible` (not sent to others at all; the avatar is hidden from others), `online`, `room`, `project`, `availability`. Last-active visibility is a separate toggle. Private-room activity never reaches a public profile.

## 6. Degraded modes (§31)

- **Realtime down:** the world shows a banner, and every page under `/community` works from Postgres.
- **GitHub down:** the last read model is shown with its "synced at" timestamp.
- **Google down:** meeting drafts and scheduling polls still work; a link is never fabricated.
- **Room full:** the next instance is offered, or the room's web page.
