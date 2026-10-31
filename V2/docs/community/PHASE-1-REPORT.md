# Phase 1 report: Foundation

Date: 31 October 2026. All work is local and uncommitted on branch `redesign/matte`.

## Implemented and verified

| Area | What exists now | Verified by |
| --- | --- | --- |
| Lint | ESLint 9 CLI with Next 16 configs (`npm run lint`). Existing code's new React-Compiler findings are warnings; community code must pass them as errors. | `npm run lint`: 0 errors |
| Migrations | `supabase/community/migrations/0001_baseline.sql` (the live schema) and `0002_foundation.sql`. Runner `npm run community:migrate` (checksums, one transaction per file, `--status`). Both applied to the live community project. | runner output; `--status` |
| Database rules | Handles; profile fields (bio, skills, time zone); per-field privacy, private by default; presence invisible by default; `get_profile` / `list_profiles` privacy filters; capabilities (moderator) granted only by owner and audited; feature flags; rate-limit helper; guideline acceptance; data export; self-serve deletion. | `tests/community-db.test.ts`: 12 suites in an in-memory Postgres |
| Auth in Next | `@supabase/ssr` cookies; middleware refreshes the session on `/community/*`; `getUser()` validation server-side; Google and GitHub buttons; PKCE callback route; return paths validated (`safeReturnPath`). | unit tests + live e2e |
| Pages | `/community` (home), `/login`, `/auth/callback`, `/welcome`, `/profile` (profile, privacy, presence, linked accounts, CooL application, export, delete, sign out), `/contributors`, `/contributors/[handle]`, `/directory` (list mode of every room), `/projects`, `/projects/[slug]` (server-cached GitHub issues), `/world` (honest holding page), `/guidelines`, `/privacy`, `/terms`, `/admin` (overview, members, applications, decisions, moderators, feature flags), `/moderation` (placeholder; see below). | live e2e |
| Security headers | CSP extended for the community backend (https + wss) and profile photos; community pages carry the per-request nonce. | live e2e checks the header |
| Navigation | "Community" added to the site header and to the static home page's nav and drawer. | — |

**Test results:**
- `npm test`: 103 tests, 102 pass, 0 fail, 1 skipped (pre-existing).
- `npx tsc --noEmit` and `npx next build` pass.
- Live end-to-end test (Playwright against `localhost:3002` and the real community database): **35 / 35**. Throwaway accounts are deleted afterwards.

**Defects found and fixed during the phase:**
- `get_profile` treated visitors' null identity as "maybe", which would have leaked members-only profiles. It was caught by the database test before reaching production.
- The time-zone list caused a hydration mismatch.
- Sign-out after account deletion now clears only the local session.

## Not real yet (by design, labelled in the UI)

- `/community/world` is a holding page until Phase 2's original-art world.
- `/community/moderation` has no queue until Phase 7; reports go by email (stated on the guidelines page).
- Districts behind flags (`commons`, `calendar`) show "Opening soon" and link nowhere.
- Projects are a code list with one real project. They move into the database in Phase 4.

## Owner actions needed (cannot be done from code)

1. **Supabase → Authentication → URL configuration:** add `http://localhost:3002/community/auth/callback` and `https://<production domain>/community/auth/callback` to the redirect URLs.
2. **GitHub sign-in:**
   - Create a GitHub OAuth App (callback `https://qchsjjyknzrcddjhshzk.supabase.co/auth/v1/callback`).
   - Enable the GitHub provider in Supabase.
   - Turn on **manual linking** so members can link GitHub to a Google account.
3. **Vercel project `cool`:** add `NEXT_PUBLIC_COMMUNITY_SUPABASE_URL` and `NEXT_PUBLIC_COMMUNITY_SUPABASE_ANON_KEY`.
4. **Rotate** the community service-role key and the database password (both were shared in chat), then update `COMMUNITY_DB_URL` in `.env.local`.
5. **Confirm the age rule** on `/community/terms` (currently: 18+, or guardian consent where the law requires it).

## Next: Phase 2

Art bible and an original tile/sprite pipeline, then the lobby prototype for approval before mass production.
