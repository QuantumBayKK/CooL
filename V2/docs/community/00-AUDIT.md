# Community rebuild — Phase 0 audit

Date: 31 October 2026. Scope: the master implementation prompt v2.0 (sections 01–40).
Nothing in either repository was changed by this audit except these documents.

## Owner decisions taken before this audit

| Question | Decision |
| --- | --- |
| Where the community lives | Inside this repository (`CooL/V2`, the company website), at `/community`. Supersedes the earlier "independent site" instruction. |
| World engine | Keep **Pixi.js v8** (the spec's Phaser preference is overridden). The existing React community code is ported into Next.js; Vite goes away. |
| Sign-in | **Google + GitHub** via Supabase Auth. No email/password (no email-delivery dependency). Spec §03/§26 asked for GitHub + email; owner changed it. |
| Art | **Original art only.** The licensed LimeZu tilesets must not ship in the final world. |

## 1. The company website (this repository)

| Item | Finding |
| --- | --- |
| Repository | `QuantumBayKK/CooL`, branch `redesign/matte`, uncommitted changes in `.gitignore`, `README.md`, `package.json`, `package-lock.json` (pre-existing, not ours). |
| Framework | Next.js **16.3.0**, React 19.2, TypeScript, Tailwind 4, App Router under `src/app`. Route groups: `(site)`, `admin`, `investor`, `api`. |
| Home page | Static `public/index.html` + `public/src/*.{css,js}` (hand-built, not a Next route). Docs are MDX under `src/app/(site)/docs`. |
| Auth | Custom server sessions for the **investor portal** and **admin** (`src/lib/auth/*`: `jose`, signed cookies, `INVESTOR_SESSION_SECRET`, `ADMIN_PASSPHRASE`, `ADMIN_SESSION_SECRET`). No member accounts. `@supabase/ssr` is already a dependency. |
| Database | Supabase, migrations `supabase/migrations/20260807000100_investor_portal.sql`, `…0200_data_room.sql`, `seed.sql`, `config.toml`. RLS verified in CI (`npm run verify:rls` against a local Supabase). |
| Middleware | `src/middleware.ts` sets CSP (nonce on dynamic pages, `'self'` on prerendered) and a presence-only cookie gate; real checks happen in pages. Next 16 warns the `middleware` convention is deprecated in favour of `proxy`. |
| Deployment | Vercel project **`cool`** (`.vercel/project.json`). `deploymentId` cache-busting in `next.config.ts`. Plan tier not visible from the repo. |
| CI | `.github/workflows/ci.yml`: `npm ci` → typecheck → verify:palette → verify:claims → test → Supabase start/reset → verify:rls → build. |
| Dependencies reusable for community | `zod` 4, `jose`, `@supabase/ssr`, `@supabase/supabase-js`, `@tanstack/react-query`, `react-hook-form`, `motion`, `ulid`, `lucide-react`. |
| Env names (values never read) | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INVESTOR_SESSION_SECRET`, `ADMIN_PASSPHRASE`, `ADMIN_SESSION_SECRET`, `CONTACT_INBOX`. No local `.env` in the working copy. |

### Baseline (run 31 Oct 2026, `F:\CooL\northwind cipher\CooL\V2`)

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | **Pass** (exit 0). |
| `npm test` | **Pass**: 84 tests, 83 pass, 0 fail, 1 skipped. |
| `npm run verify:all` | **Pass** (typecheck, validator, palette, claims, tests). |
| `npm run lint` | **Fails**: `next lint` was removed in Next 16 ("Invalid project directory … \lint"). Pre-existing. Fix: switch to the ESLint CLI. |
| `npx next build` | **Pass** (run earlier the same day). |
| `npm run verify:rls` | Not run locally (needs Docker / local Supabase). Runs in CI. |

## 2. The current community (`northwindcipher-community`, separate folder)

| Item | Finding |
| --- | --- |
| Version control | **None** — not a git repository. |
| Stack | Vite 5, React 18, TypeScript, Pixi.js v8. Ships the legacy Electron "Munder Difflin" harness too (17 MB `dist`, `/legacy` reachable). |
| Database | Separate Supabase project `qchsjjyknzrcddjhshzk`. One idempotent `supabase/schema.sql` (no migrations): `admins`, `profiles`, `contribution_requests`, `admin_audit`, RPCs `complete_onboarding`, `list_members`, `review_request`, `set_contributor`, `is_admin` (requires a verified Google identity). |
| Auth | Supabase Google OAuth, PKCE. |
| Features | Welcome wizard (name, character, CooL experience, reason, optional contributor application), profile page, admin panel (overview / members / applications / decisions, audit), opt-in members directory, CooL SDK page reading public GitHub issues client-side, single-player Pixi office with three static team NPCs, avatar creator (procedural, original). |
| Tests | 36 unit tests in repo. 44 database checks (PGlite) and a 52-step live end-to-end suite exist **only in a scratch folder** — must be moved in. |
| Art | LimeZu "Modern Interiors" tilesets (purchased licence, raw files git-ignored, cannot be redistributed). Characters are original procedural sprites (`scene/office/avatar*`, `cast`). |
| Deployment | Vercel project `northwind-cipher-community` on Rehan's account; deploys must be done from built files because the tilesets are not in git. |
| Docs | `README`, `COMMUNITY_IMPLEMENTATION.md`, `docs/community/{HANDOFF,MASTER_SPEC_ALIGNMENT,SETUP,LAUNCH_CLEANUP}.md` — **stale**; they describe Phaser, demo routes, an `api/` folder, migrations and GitHub verification that no longer exist. |
| Secrets | Service-role key and database password were shared in chat earlier: **rotate before any production use.** |

## 3. Reuse vs replace

| Existing piece | Verdict | Reason |
| --- | --- | --- |
| Pixi office renderer, `Character`, `Camera`, `TiledMapRenderer` | **Retain and port** | Owner chose Pixi; renderer is engine-level and art-agnostic. |
| LimeZu tilesets and `office.tmj` map | **Replace** | Original-art requirement. Kept only as a development placeholder until Phase 2 art lands, never in production. |
| Procedural avatar system + editor | **Retain, extend** | Original work. Needs work/sit/wave animations and earned cosmetics (§08). |
| Supabase community project + Google OAuth | **Retain** as the community identity/data store | Working, verified admin model. Add GitHub provider + manual linking. |
| `profiles`, onboarding RPCs | **Migrate** into versioned migrations; extend with privacy fields | Spec §08, §25. |
| `admins` table + `is_admin` | **Replace** with capability-based roles (§23) | Spec roles: Owner, Maintainer, Contributor, Visitor + Moderator capability. Keep the verified-Google rule for Owner. |
| `contribution_requests` | **Replace** with project applications (§18) | Generalised to any project. |
| `admin_audit` | **Generalise** into `audit_logs` | §27. |
| Admin panel UI | **Retain pattern**, re-host under `/community/admin` and `/community/moderation` | |
| Client-side GitHub issue fetch | **Replace** with server read models fed by a GitHub App (§19) | 60 req/h per visitor IP limit; spec requires verified evidence. |
| Static team NPCs in the office | **Remove** | Fake presence; replaced by real opted-in presence (§10). |
| Electron harness, Monaco workers | **Drop** | Not part of the community. |
| Main site investor/admin auth | **Leave untouched** | Separate audience; spec forbids changing production auth without approval. |

## 4. Asset and licence inventory

| Asset | Source | Licence | Final product? |
| --- | --- | --- | --- |
| LimeZu Modern Interiors tilesets | Purchased | Commercial, no redistribution | **No** (placeholder only) |
| Office characters (`cast.ts`, `avatar*.ts`) | Original procedural code | Repo MIT | Yes, extended |
| NC logo / mark | Northwind Cipher | Company IP | Yes |
| Doto, Plus Jakarta Sans, Geist Mono | Google Fonts | SIL OFL 1.1 | Yes (licences bundled) |
| Founder portraits | Company | Company IP | Yes |

## 5. Conflicts with production that need approval before work starts

1. **Repository branch.** This repo has uncommitted work on `redesign/matte`. Community work should branch from an agreed base (proposed: `main` after `redesign/matte` lands).
2. **Two Supabase projects.** Main site (investor data room) and community use different projects. Proposal: keep them separate (smaller blast radius; investor data never shares a database with public sign-ups). The free tier allows exactly 2 active projects.
3. **Vercel plan.** Hobby is non-commercial only (Vercel fair-use guidelines). A company site likely needs Pro — see the cost register.
4. **Middleware → proxy rename** in Next 16: needed eventually; touching it changes production routing/CSP, so it is listed, not done.
5. **The standalone community deployment** stays up until the `/community` route replaces it; then it redirects.
