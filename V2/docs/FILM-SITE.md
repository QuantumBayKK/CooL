# The film-led public site

The public site at northwindcipher.com: a monochrome, scroll-choreographed
presentation of CooL whose claims are checked against evidence and whose
verifier demo cannot be made to show a pass it did not earn.

## Routes

| Route | What it is |
|---|---|
| `/` | Hero film, statement, questions, product, Sequence A (recorder → receipt), Sequence B (pipeline), Sequence C (verifier terminal), evidence, comparison, audiences, ecosystem, developer snippet, dated log, final CTA |
| `/verify` | Real `cool.receipt.v1` verifier in the browser: sample fixtures, one-byte tamper, restore, drop your own receipt (never uploaded), CLI fallback |
| `/evidence` | Seven-domain table, tamper matrix, workload-change diff, raw artefact links, reproduction commands |
| `/limits` | Every limitation, from the claim registry, with source and check date |
| `/developers` | cool-nwc 3.0.0 quickstart, API, entry points, CLI, links to the spec and threat model |
| `/pricing` | Launch pricing; billing status; PLANNED markers on unbuilt features |
| `/team` | Founders (content reused from the signed-off previous site) |
| `/design-partners` | Pilot offer and expectations; booking link only, no form |
| `/security` | Data flow, key handling, supply chain, disclosure |
| 404 | Inverted scene, `src/app/not-found.tsx` |

Older surfaces keep their own shell and design system: `/docs`, `/demo`,
`/walkthrough` (the former `/verify` story), `/console`, `/studio`,
`/security/model` (the former `/security`), `/security/readiness`,
`/privacy`, the investor room and admin. Retired routes redirect (308):
`/technology → /#pipeline`, `/architecture → /security`, `/about → /team`,
`/contact → /design-partners`, `/thank-you → /`.

## Where things live

| Path | Contents |
|---|---|
| `src/app/(film)/` | Route group, layout, `film.css` (the whole design system) |
| `src/components/film/` | `BlackBoxHero`, `RecorderSequence` (A), `EvidenceSequence` (B), `VerdictTerminal` (C), `FlightTape`, `FilmFx` (detonation canvas, seismograph, cursor, grain), `HudFrame`, `SplitFlapCounter`, `BootSequence`, `RouteWipe`, `Nav`, `Footer`, `ReceiptDrop`, `Ecosystem` |
| `src/content/claims.ts` | The claim registry — status, source, check date, permitted wording |
| `src/content/copy.ts` | Editable page prose |
| `src/lib/film/` | `motion.ts` (tokens), `reducedMotion.ts`, `detonation.ts` (impact planner + particle pool), `verdictView.ts` (the only verdict → UI mapping), `fonts.ts` |
| `src/lib/receipts/` | Fixture list, `tamperOneByte()`, provenance README |
| `public/film/` | 1-bit frame sequences and grain; `CREDITS.md` |

## Claim registry workflow

1. Every public technical or quantitative statement is an entry in
   `src/content/claims.ts`: `status` (REAL / SIMULATED / ABSENT / PLANNED /
   UNVERIFIED), `source`, `checked`, `wording`, `publish`.
2. Pages render `claim(id)` or `CLAIMS[id].wording`; they do not retype claims.
3. To change a claim, re-read its source, update `wording`, `status` and
   `checked` together.
4. `tests/film-claims.test.ts` fails if an entry lacks a source or date, if an
   UNVERIFIED claim is publishable, or if publishable wording uses banned
   language (immutable, tamper-proof, court-admissible, guaranteed, open
   source, production-ready).
5. `npm run verify:claims` additionally enforces the readiness-gate phrase list
   in `src/content/gates.ts` across all user-visible copy.

## Claim ledger (checked 2026-10-20)

| Claim | Status | Evidence |
|---|---|---|
| 7 domains verified on Intel TDX (Phala Cloud, 2 × tdx.small) | REAL | cool-sdk `artifacts/closure-verification-matrix.md` |
| 11-row tamper matrix, each fails expected domain | REAL | same |
| Workload change: RTMR3 differs, rejected against old pin | REAL | same |
| 36/36 consistency pairs | REAL | same |
| 119/119 fixture tests, 0 skipped (software, not silicon) | REAL | same |
| Anchor | ABSENT | same (final verdict: anchor absent); README roadmap (OpenTimestamps shipped, Bitcoin confirmation experimental) |
| CPU TDX only; dev OS image; no quote freshness; online Phala attestation; unsigned manifest; same-account witness | REAL (limits) | same |
| External witnesses, GPU attestation | PLANNED | cool-nwc 3.0.0 README roadmap |
| ML-DSA-65 + Ed25519; RFC 6962 log; salted commitments | REAL | cool-nwc 3.0.0 README |
| No telemetry; no SDK network calls | REAL | cool-nwc 3.0.0 `dist/index.d.ts` header |
| No postinstall scripts | REAL | cool-nwc 3.0.0 README |
| 5 runtime dependencies | REAL | registry.npmjs.org/cool-nwc/3.0.0 |
| Licence: BUSL-1.1 (3.0.0 and earlier Apache-2.0) | REAL | cool-sdk `LICENSE`, npm metadata |
| Browser verifier is the real v1 verifier; vectors are mock-attested | REAL / SIMULATED | `src/lib/cool/verify.ts`, `public/cool-vectors/` |
| NVIDIA Inception member; Phala infrastructure; Edgeless collaboration in progress | REAL / REAL / PLANNED | prior signed-off site copy; matrix |
| Certifications, customers, billing, external audit | ABSENT | SECURITY.md; prior signed-off copy |
| Uptime / latency / user counts | UNVERIFIED — not published | none exist |

Omitted or downgraded relative to the brief: "open source" (BUSL-1.1),
any hosted-billing or checkout flow, advisors, customer logos, GPU
attestation, independent witness operation, and the Gate-2 phrase
"air-gapped install" (Enterprise lists isolated deployment as PLANNED).

## Footage

Two Pexels-licensed clips (credits in `public/film/CREDITS.md`) converted with
ffmpeg to 1-bit Bayer-dithered 640×360 PNG sequences: `hero/` (120 frames,
~0.5 MB, 10 s loop at 12 fps) and `recorder/` (96 frames, ~0.65 MB, scroll
scrubbed). Frames are drawn to a canvas with `image-rendering: pixelated`;
the first hero frame is a plain `<img>` and is the LCP element. A 1-bit image
sequence replaced the brief's WebM/MP4: video codecs smear an ordered dither
into grey, which would break both the pixel look and the monochrome rule.

To regenerate (see the exact filter chain in the commit that added them):
greyscale → `curves` → `paletteuse=dither=bayer:bayer_scale=2` against a
256-entry black/white palette → `-pix_fmt monob`.

## Motion and accessibility

- `prefers-reduced-motion`: no particles, shake, scrub, boot, wipe or film
  playback; impacts become a 120 ms inversion; Sequence A renders stacked.
- Impacts: one engine (`FilmFx`), `data-impact="small|full|max"` on any
  control; full/max rate-limited to one per 400 ms; flashes capped at 3/s.
- Low power (≤4 cores or Save-Data): particle cap 24, no shake, half-rate film.
- Hero film and flight tape have visible pause controls.
- Custom cursor only on fine pointers; hidden while navigating by keyboard.
- Decorative canvases, grain, seismograph and boot are `aria-hidden`; the
  verifier result is announced in a polite live region.
- No GSAP, Lenis, Three.js or Howler: scroll choreography is native
  (rAF-throttled scroll + IntersectionObserver), which kept the added JS
  small. Sound was dropped. Forms were dropped at the owner's request.

## Checks

```sh
npm run typecheck
npm run verify:mono     # monochrome audit: CSS/TSX/SVG colour literals + 1-bit PNGs
npm run verify:claims   # readiness-gate phrases
npm test                # includes film-verdict, film-motion, film-claims
npm run build
```
