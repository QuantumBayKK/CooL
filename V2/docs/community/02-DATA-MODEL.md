# Community rebuild — data model

Status: **proposal.** PostgreSQL in the community Supabase project. All timestamps are `timestamptz` in UTC. Every table has RLS enabled. Writes that need a transaction or cross-row checks go through `security definer` functions called from the Next server, never directly from browsers.

Migrations go in `supabase/community/migrations/NNNN_name.sql`, with a down-migration note in each file. The current `schema.sql` becomes migration `0001_baseline.sql` so the live project upgrades in place.

## Identity and profiles

| Table | Key columns and constraints |
| --- | --- |
| `profiles` *(exists)* | `id → auth.users`, `handle citext unique` (3–30, `^[a-z0-9-]+$`), `display_name`, `bio ≤ 280`, `timezone`, `avatar jsonb`, `onboarded_at`, `guidelines_accepted_at` |
| `profile_privacy` | `user_id pk`, one visibility per field (`public` \| `members` \| `private`) for bio, timezone, skills, projects, contributions, last_active; `dm_policy` (`anyone` \| `shared_project` \| `nobody`) |
| `profile_skills` | `(user_id, skill)` unique; skill from a curated table, plus "other" text with a length limit |
| `linked_accounts` | view over `auth.identities`: provider and provider handle only, never tokens |
| `platform_roles` | `(user_id, role)` unique, role ∈ {owner}; `capabilities (user_id, capability)` for moderator and future grants. Replaces `admins`. |

## World

| Table | Notes |
| --- | --- |
| `rooms` | `id text pk` (stable, e.g. `hq.lobby`), `type`, `map_version`, `capacity check 1..50`, `visibility`, `project_id null`, `access_policy jsonb` |
| `room_decorations` | optional persistent state per room |
| `presence_settings` | `user_id pk`, `mode`, `show_last_active`, `last_active_at` (written at most once per 5 min, only if shown) |

There are no movement or presence-history tables. Instances and seats live only inside the Durable Object.

## Projects and GitHub

| Table | Notes |
| --- | --- |
| `projects` | `slug unique`, `name`, `summary`, `status` (incubating \| recruiting \| active \| paused \| completed \| archived), `visibility`, `license`, `proposal_id null` |
| `project_members` | `(project_id, user_id)` unique, `role` (maintainer \| contributor), `joined_at`, `left_at` (history kept) |
| `project_tags`, `project_milestones`, `project_tasks` | tasks: `claimed_by null`, claim through a function using `select … for update` |
| `project_roles_wanted` | role, count, skills, beginner_ok, mentorship, time estimate |
| `project_applications` | replaces `contribution_requests`; partial unique index enforces one pending application per (project, user) |
| `project_follows` | follow without joining |
| `integration_installations` | GitHub App installation id, account, repository selection, `revoked_at` |
| `project_repositories` | `(project_id, github_repo_id)` unique, `installation_id`, `synced_at`, `sync_status` |
| `gh_issues`, `gh_pulls`, `gh_reviews`, `gh_releases` | normalised read models, keyed by GitHub id, `updated_at` from GitHub |
| `contribution_evidence` | `(user_id, kind, github_id)` unique; created only from verified webhook or reconciliation data |
| `webhook_deliveries` | `delivery_id unique`, `event`, `received_at`, `status`, `attempts`, `error`; raw bodies are not kept |
| `webhook_jobs` | outbox with `run_after`, `attempts ≤ 8`, dead-letter status |

## The Commons

| Table | Notes |
| --- | --- |
| `proposals` | `status` enum over the full §13 lifecycle; `author_id`; `current_version_id`; `category`; `seeks_team bool` |
| `proposal_versions` | immutable snapshot of every §13 field, `version int`, `(proposal_id, version)` unique, `material bool` |
| `proposal_status_history` | `from`, `to`, `actor_id`, `reason`, `at`. Written **only** by `transition_proposal()`, which enforces the allowed-transition table. |
| `proposal_comments` | threaded (`parent_id`), `edited_at`, `deleted_at` (tombstone text), moderation flags |
| `proposal_followers` | follow for notifications |
| `polls` | `kind` (single \| multi \| yes_no_abstain \| ranked \| availability \| interest), `binding bool`, `eligibility jsonb` (scope + rule), `opens_at`, `closes_at`, `quorum jsonb`, `pass_rule jsonb`, `vote_change` (none \| until_close), `visibility` (anonymous \| public), `decision_owner_id`, `next_action`, `status`, `subject` (proposal or project) |
| `poll_options` | `(poll_id, position)` unique |
| `poll_eligibility` | snapshot of the eligible voter set when the poll opens (prevents late sock-puppet joins) |
| `ballots` | **`unique (poll_id, voter_id)`**; `submitted_at`; `superseded_at` when vote change is allowed |
| `ballot_choices` | `(ballot_id, option_id)` + `rank` / `points`; validated by `cast_ballot()` |
| `poll_results` | written once by `close_poll()` in the same transaction that locks ballots |
| `poll_audit` | invalidation, revote and close records. Readable by owner; anonymous ballots are never joined to voters in any view. |

For anonymous polls, `ballots.voter_id` is readable only through `security definer` functions that never return it alongside choices. Public tallies come from `poll_results`.

## Calendar, events and meetings

| Table | Notes |
| --- | --- |
| `scheduling_polls`, `scheduling_slots` | slots stored as UTC start/end plus the organiser's IANA zone |
| `availability_responses` | `(slot_id, user_id)` unique, `answer` (yes \| maybe \| no), `rank null` |
| `events`, `event_rsvps`, `event_waitlist` | `capacity`; RSVP and waitlist promotion in one function |
| `calendar_connections` | `user_id pk`, `scope`, `refresh_token_ciphertext` (AES-256-GCM, key in a server env var, never in the DB), `revoked_at` |
| `meetings` | `status` (draft \| creating \| conference_pending \| ready \| full \| ending \| completed \| cancelled \| failed), `idempotency_key unique`, `gcal_event_id`, `meet_url null` (set only from a Google response), `capacity`, `access_policy`, `room_id` |
| `meeting_invitees`, `meeting_provider_events` | provider responses with status code and timestamp; no tokens |

## Messaging, notifications, moderation

| Table | Notes |
| --- | --- |
| `conversations` | `kind` (room \| project \| dm \| thread), `subject_id` |
| `conversation_members` | `last_read_at`, `muted` |
| `messages` | `body ≤ 2000` plain text (links detected and rendered safely), `edited_at`, `deleted_at`; index `(conversation_id, created_at desc)` |
| `blocks` | `(blocker_id, blocked_id)` unique |
| `notifications`, `notification_preferences` | in-app only until email is approved |
| `moderation_reports` | subject type/id, `reporter_id` (never shown to the subject), category, severity, status |
| `moderation_actions` | action, duration, reason, `actor_id`; append-only |
| `appeals` | — |
| `rate_limits` | `(key, window_start)` counter row, incremented by one upsert function |

## Operations

`audit_logs` (generalises today's `admin_audit`; append-only, written only by functions) · `feature_flags` · `cost_usage_snapshots` (manual entry at first, then pulled automatically where a provider API allows).

## Indexes called out by the spec

- Projects: `(status)` and a public full-text search on `(name, summary)`.
- Polls: active polls `(status, closes_at)`.
- Events: upcoming events `(starts_at) where status = 'scheduled'`.
- Notifications: unread `(user_id) where read_at is null`.
- Messages: unread is computed from `last_read_at` against `messages(conversation_id, created_at)`.
- Room membership lives in memory, so it needs no index.
