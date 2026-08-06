# CooL — website, evidence surfaces and investor portal

The public site, the surfaces that run the real cryptography in the visitor's
browser, and a private investor room behind single-use invite codes.

```bash
npm install
npm run dev          # http://localhost:3002
npm run verify:all   # typecheck + palette + claims + tests
```

The portal needs a database. Docker and the Supabase CLI, then:

```bash
npm run db:start     # supabase start
npm run db:reset     # migrations + seed
cp .env.example .env.local   # fill from `npm run db:status`
```

---

## The one rule this repository is built around

**Nothing on this site may claim more than the product can actually do.**

That is not a style guideline, it is a build gate. `src/content/gates.ts` holds
a four-rung readiness ladder and the exact sentence each rung licenses.
`scripts/verify-claims.mjs` reads `CURRENT_GATE` from it and **fails the build**
if any page contains a phrase reserved for a rung above the one the product is
on.

```text
FAIL  src/content/investors.ts:58
      reserved phrase: "battle-tested"
      licensed only at Gate 3; we are at Stage 0
```

It caught a real over-claim in existing copy the first time it ran.

Raising the site's claims is a deliberate one-line edit to `CURRENT_GATE`, and
it will not pass CI until the items justifying that rung are actually ticked.
This is the same mechanism the product's verifier uses to stop `simulated`
rounding up to `pass`: **the rule lives in code, not in an instruction someone
has to remember.**

Today the product is at **Stage 0** — "here's a working demo, verify it
yourself, offline." Two of seven verification domains do not pass, and both are
named on the homepage rather than buried.

---

## Routes

### Public

| Route | What it is |
| --- | --- |
| `/` | Landing. Every claim followed immediately by the artifact that proves it |
| `/technology` | The pipeline stage by stage — what each step computes |
| `/architecture` | Control plane / data plane, trust boundaries, failure model |
| `/security` | Seven verification domains, and the two that do not pass |
| `/security/readiness` | The published gate ladder |
| `/docs` | MDX documentation with client-side search |
| `/pricing` | No prices, and the page explains why in its first sentence |
| `/about`, `/contact` | Company, and a form that is not wired to a CRM |

### Evidence surfaces — the real cryptography

| Route | What it is |
| --- | --- |
| `/verify` | Seven stops. One prompt edit and everything that follows from it |
| `/pipeline` | The same machinery with the lid off, plus four buttons that forge the receipt |
| `/console` | The operator's view: estate, risk, obligation coverage, audit export |
| `/studio` | The SDK, an Atlassian-shaped console, and a VS-Code-shaped IDE |
| `/billboard` | Terminal billboard — live-types the verify command |

These run `src/lib/cool/` — the vendored SDK — in the visitor's browser. Not a
re-enactment, not an animation, not a recording.

### Private

| Route | Protection |
| --- | --- |
| `/investor/login` | Invite code, rate limited 5 per 15 min per /24 |
| `/investor/*` | Encrypted session + server-side row check on every request |
| `/admin/*` | Passphrase, rate limited 5 per hour |

---

## Security model

The portal's design is written up in
[`supabase/migrations/20260807000100_investor_portal.sql`](supabase/migrations/20260807000100_investor_portal.sql),
which opens with the threat model it was written against. The short version:

**RLS is enabled AND forced on all five portal tables, with zero policies.**
The Supabase anon key is public — it ships in every visitor's bundle — so a leak
of it must grant nothing. Every access goes through server code holding the
service role, from routes that also write the audit entry, so access control and
its record cannot drift apart.

**The audit log is append-only by trigger, not only by policy.** A policy can be
dropped by whoever reaches the database as owner; the trigger makes the mutation
itself raise.

**Rate limiting lives in Postgres.** An in-process limiter resets on every
serverless cold start and multiplies by instance count. Neither failure shows up
in testing and both are trivially exploitable.

**Redemption is one transaction under `for update`,** so two concurrent requests
cannot both consume the last use of a single-use code.

**Every redemption failure returns one identical body.** Distinguishing unknown
from revoked from expired would turn a 40-bit code space into an oracle. The
real reason goes to the audit log, where the admin can see it and an attacker
cannot.

**Sessions are two coupled halves** — an encrypted JWE cookie and a hashed row.
The cookie cannot outlive a revocation; a database dump yields no usable cookie.

All of this is proven rather than asserted:

```bash
npm run verify:rls
```

```text
  PASS  invite_codes RLS enabled / forced
  PASS  zero permissive policies on public schema
  PASS  UPDATE on audit_log is rejected
  PASS  DELETE on audit_log is rejected
  PASS  data-room bucket is private
```

### Middleware is not the authorisation boundary

It checks only that a cookie is *present*. The real check — decrypt, fetch the
row, compare the token hash, confirm not revoked and not expired — happens in
the route group's layout.

That split is deliberate: authorisation living only in middleware is one
`matcher` typo away from being silently absent, and a matcher typo produces no
error, just an open door. A route added under `investor/(room)/` tomorrow is
protected by existing.

---

## Design system

White, black, deep red. IBM Plex Sans for display, Inter for UI, Geist Mono for
digests and CLI output. Hairline rules rather than shadows. 48px is the top of
the type scale — an oversized hero forces every later section to shout to stay
in proportion, and the page ends up with no quiet register left for the detail
that convinces an engineer.

**Red is overloaded on purpose, and the overload is scoped.** On marketing
surfaces it is the brand accent and marks the primary action. Inside
`[data-surface="console"]` it means failure and only failure — primary actions
there are ink-filled. A console that painted its "Run" button the same colour as
its "signature invalid" badge would be teaching the reader to ignore the one
colour that has to stop them.

Two guards:

```bash
npm run verify:palette   # 28 fg/bg pairs, WCAG AA, both themes
npm run verify:claims    # the readiness gate
```

Chart series were measured, not chosen — both theme sets pass a CVD/contrast
validator on lightness band, chroma floor, adjacent-pair separation under
simulated protanopia, deuteranopia and tritanopia, and contrast. The dark set is
re-stepped rather than lightened: the dark lightness band sits lower, so the
orange had to go *darker* to stay legal.

Motion has hard ceilings — ≤8px translate, ≤240ms, monotonic easing only, and no
spring anywhere. Overshoot is what makes an interface feel consumer.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on :3002 |
| `npm run build` | Production build |
| `npm run verify:all` | Typecheck, palette, claims, tests |
| `npm run verify:palette` | WCAG AA contrast, both themes |
| `npm run verify:claims` | Readiness-gate claim scanner |
| `npm run verify:rls` | Database security conformance (needs a running DB) |
| `npm run verify:sdk` | Proves the vendored SDK matches the published spec |
| `npm run verify:tee` | Attacks the confidential-compute properties |
| `npm run db:start` / `db:reset` / `db:status` | Local Supabase |

---

## Local development

The public site builds and runs **without any credentials** — a contributor
working on docs should not need a database. Portal routes detect the missing
configuration and render an explicit "not configured" state rather than a 500.

With a database, `npm run db:reset` seeds a dev-only invite code:

```text
COOL-INV-DEV0-CAFE
```

Its hash exists in no hosted database, because production never runs `seed.sql`.

Note the alphabet: **I, L, O and U are excluded** from generated codes because
they are what people confuse when retyping. A code containing one is rejected by
normalisation before it reaches the database.

---

## What is not built

Stated here for the same reason it is stated on the site.

- **Hardware attestation is simulated.** No TDX in the loop. The verifier
  reports `simulated` and can never report `pass`.
- **Public anchoring is absent.** The log is signed by our keys alone, which is
  not tamper-evident against us. External witnesses close this. Gate 2.
- **The admin console is one shared passphrase.** Correct for one admin; the
  moment there are two it must become Supabase Auth plus an allowlist, because a
  shared credential cannot be revoked for one holder or attributed to a person.
- **Contact submissions are logged, not delivered.** Wire a transport in
  `src/app/api/contact/route.ts`.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for going to production.
