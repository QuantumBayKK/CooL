# The public site

northwindcipher.com: a light, professional product site for CooL whose
claims are checked against evidence and whose live verifier cannot be made to
show a pass it did not earn. (The route group is still named `(film)` for
history; the pixel-film treatment was retired in Oct 2026.)

## Routes

| Route | What it is |
| --- | --- |
| `/` | Hero with the real 7-domain hardware result, trust strip, problem, product, how it works (3 steps), pipeline, live verifier, evidence stats + limits, comparison, audiences, ecosystem, developer code tabs, FAQ, changelog, CTA |
| `/verify` | Real `cool.receipt.v1` verifier in the browser: sample fixtures, one-byte tamper, restore, drop your own receipt (never uploaded), CLI fallback |
| `/evidence` | Seven-domain table, tamper matrix, workload-change diff, raw artefact links, reproduction commands |
| `/limits` | Every limitation from the claim registry, with source and check date |
| `/developers` | cool-nwc 3.0.0 quickstart, API, entry points, CLI |
| `/pricing` | Launch pricing; billing status; PLANNED markers on unbuilt features |
| `/about` | Mission, company facts, founders, ecosystem (`/team` 308s here) |
| `/platform-tour` | Capture → seal → log → attest → verify, with real CLI commands |
| `/deploy/phala` | Running on Intel TDX via Phala dstack, with limits |
| `/use-cases` | Where CooL fits — explicitly not customer stories |
| `/docs/*` | MDX docs in `content/docs` (concepts and CLI reference generated from the cool-nwc 3.0.0 manual in `content/cli-manual.json`) |
| `/blog`, `/blog/*` | MDX posts in `content/blog`, each with a `source` |
| `/faq`, `/contact` | FAQ from the claim registry; booking link and emails, no form |
| `/design-partners` | Pilot offer and expectations; booking link only, no form |
| `/security` | Data flow, key handling, supply chain, disclosure |
| 404 | `src/app/not-found.tsx` |

Navbar mirrors the reference structure: announcement bar, Platform ▾ (tour, deploy, security), Docs, Use cases, Pricing, Resources ▾ (blog, FAQ, about), theme toggle (light/dark, saved), Studio, Book a demo.

Older surfaces keep their own shell: `/demo`, `/walkthrough`,
`/console`, `/studio`, `/security/model`, `/security/readiness`, `/privacy`,
the investor room and admin. Retired routes 308: `/technology → /#pipeline`,
`/architecture → /security`, `/about → /team`, `/contact → /design-partners`,
`/thank-you → /`.

## Design system

All in `src/app/(film)/film.css`, scoped under `.film`.

- **Palette:** white / cool-grey surfaces (`--bg`, `--bg-2`), navy ink
  (`--ink #0b1526`), brand blue (`--brand #1e50a2`), dark navy bands
  (`.f-invert`, footer, trust strip), dark code windows (`.f-term`). Status
  chips pair a colour with the word (PASS, MOCK, ABSENT, PLANNED…), never
  colour alone. `npm run verify:film-palette` checks every text/background
  pair against WCAG AA 4.5:1 straight from the stylesheet.
- **Type:** Inter (text), Inter Tight (headings), JetBrains Mono (code,
  eyebrow labels), self-hosted via next/font.
- **Shape:** 8px buttons, 14px cards, soft shadows, 1px hairlines.
- **Motion:** subtle scroll reveal (off without JS and under reduced motion),
  a progressive pipeline highlight, hover lifts. Nothing decorative runs on
  the main thread.
- **Mobile:** every grid collapses to one column under 640px, button rows go
  full-width under 480px, tables scroll inside their frame, the mobile menu
  is a focus-trapped overlay that returns focus on Escape.

Components: `Hero` (verification panel), `Nav`, `Footer`, `SectionHead` /
`PageHead`, `HudFrame` (card) + `StatusChip`, `Icons`, `CodeTabs`
(ARIA tabs), `EvidenceSequence`, `VerdictTerminal`, `ReceiptDrop`,
`Ecosystem`, `CopyCommand`, `Reveal`, `JsFlag`.

## Claim registry workflow

1. Every public technical or quantitative statement is an entry in
   `src/content/claims.ts`: `status` (REAL / SIMULATED / ABSENT / PLANNED /
   UNVERIFIED), `source`, `checked`, `wording`, `publish`.
2. Pages render `claim(id)` / `CLAIMS[id].wording` rather than retyping.
3. To change a claim, re-read its source and update `wording`, `status` and
   `checked` together.
4. `tests/film-claims.test.ts` and `npm run verify:claims` enforce sources,
   dates, banned language and readiness-gate phrases.

The hero panel's eight rows are the per-domain results of the published
Phala Cloud run (`artifacts/closure-verification-matrix.md`), including the
anchor domain, which is shown as ABSENT.

## Claim ledger (checked 2026-10-20)

| Claim | Status | Evidence |
| --- | --- | --- |
| 7 domains verified on Intel TDX (Phala Cloud, 2 × tdx.small) | REAL | cool-sdk `artifacts/closure-verification-matrix.md` |
| 11-row tamper matrix; workload change rejected; 36/36 consistency pairs; 119/119 fixture tests | REAL | same |
| Anchor | ABSENT | same; README roadmap (OpenTimestamps shipped, Bitcoin confirmation experimental) |
| CPU TDX only; dev OS image; no quote freshness; online Phala attestation; unsigned manifest; same-account witness | REAL (limits) | same |
| External witnesses, GPU attestation | PLANNED | cool-nwc 3.0.0 README |
| Hybrid ML-DSA-65 + Ed25519; RFC 6962; salted commitments; no telemetry; no install scripts; 5 runtime deps | REAL | cool-nwc 3.0.0 README, typings, npm metadata |
| Licence BUSL-1.1 (3.0.0 and earlier Apache-2.0) | REAL | cool-sdk `LICENSE`, npm |
| NVIDIA Inception; Phala infrastructure; Edgeless collaboration in progress | REAL / REAL / PLANNED | prior signed-off copy; matrix |
| Certifications, customers, billing, external audit | ABSENT | SECURITY.md; prior signed-off copy |

## Checks

```sh
npm run typecheck
npm run verify:film-palette   # WCAG AA contrast of the site palette
npm run verify:claims         # readiness-gate phrases
npm test                      # includes film-verdict and film-claims
npm run build
```
