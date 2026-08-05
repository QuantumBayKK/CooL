# STEP 0 — Audit of the public site against the build document

**Branch:** `web-polish` (worktree `wt-web`, HEAD `e3e143e`)
**Date:** 2026-08-06
**Scope:** audit only. **No code was changed.** The only file this session writes is
this report.

**Build document under audit:**
`C:\Users\Pranauv Shrinaath\downloads\cool-finalsdk\PROMPT-northwindcipher-rebuild.md`
(Parts 4–8 are the sections this report diffs against.)

**What I could not do, stated up front:**

- **I cannot test on physical hardware.** There is no real iPhone and no real
  Android device in this environment. Everything in §5 and every "mobile" claim
  in §6 is **Chrome device emulation** (CDP `Emulation.setDeviceMetricsOverride`
  at 390×844, DPR 3, `mobile: true`, touch emulation on). Emulation is not a
  phone. It does not reproduce iOS Safari's URL-bar collapse, real momentum
  scrolling, or Safari's own `overflow`/`overscroll` quirks — which is exactly
  the class of bug this page was fixed for. Every Part 8 item that says "real
  phone" is marked **NOT-TESTABLE-HERE**.
- **I did not run Lighthouse.** No Lighthouse binary is present, and installing
  one would touch `V2/package.json`, which belongs to Session A. I have not
  estimated a score. In its place §6 reports **measured wire bytes** for every
  asset the public route requests. There is no performance score in this report
  because I did not measure one.

---

## 1 · Baseline, measured

### `npm run build` (from `wt-web/V2`, exit 0)

```
   ▲ Next.js 15.5.22

   Creating an optimized production build ...
 ✓ Compiled successfully in 10.9s
   Linting and checking validity of types ...
 ⨯ ESLint must be installed in order to run during builds: npm install --save-dev eslint
   Collecting page data ...
 ✓ Generating static pages (18/18)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS
┌ ○ /                                    5.36 kB         111 kB
├ ○ /_not-found                             1 kB         104 kB
├ ○ /billboard                           2.29 kB         179 kB
├ ○ /dashboard                           23.2 kB         167 kB
├ ○ /deck                                 255 kB         422 kB
├ ○ /demo                                21.4 kB         185 kB
├ ○ /icon.svg                                0 B            0 B
├ ○ /investors                           1.46 kB         107 kB
├ ○ /investors/diligence                 9.62 kB         177 kB
├ ○ /opengraph-image                       135 B         103 kB
├ ○ /pipeline                            16.5 kB         231 kB
├ ○ /robots.txt                            135 B         103 kB
├ ○ /sdk                                 4.82 kB         148 kB
├ ○ /sitemap.xml                           135 B         103 kB
├ ○ /studio                                39 kB         202 kB
└ ○ /why                                 15.2 kB         159 kB
+ First Load JS shared by all             103 kB
  ├ chunks/1255-cf02c4775860a5ab.js        46 kB
  ├ chunks/4bd1b696-100b9d70ed4e49c1.js  54.2 kB
  └ other shared chunks (total)          2.25 kB

○  (Static)  prerendered as static content
```

**The number every later layer is measured against: `/` = 5.36 kB route, 111 kB
First Load JS.** All 18 pages prerender statically; the public route has no
client boundary.

### `npm run typecheck`

```
> tsc --noEmit
EXIT=0
```

Clean. Zero diagnostics.

### The ESLint line

`⨯ ESLint must be installed in order to run during builds` is **pre-existing and
not a failure** — the build exits 0. `eslint` is genuinely absent from
`V2/package.json` (checked: `dependencies` and `devDependencies` both). Fixing
it requires editing `V2/package.json`, which **Session A owns**. Not touched, not
proposed.

### Tooling reality (re-verified against `V2/package.json`)

| Tool | Status |
|---|---|
| `three` | **installed**, `^0.185.1` |
| `@react-three/fiber` | **installed**, `^9.6.1` |
| `@react-three/drei` | **installed**, `^10.7.7` |
| `gsap` | **installed**, `^3.15.0` |
| `@gsap/react` | **installed**, `^2.1.2` |
| `eslint` | **absent** (see above) |
| `zanwie/design-dna` | **not installed, not in catalog.** Substitute: the installed `ui-ux-pro-max` skill — *labelled a substitute, not the requested tool.* |
| "motion-design" skill | **does not exist under that name.** Substitute: the installed `framer-motion-animator` skill — *labelled a substitute.* |
| `athevon/genjutsu` | **unavailable.** Purpose unknown. No use invented for it. |

---

## 2 · Copy diff vs the build document, Parts 4–7

Method: word counts and text are extracted from the **built** `index.html`
(`.next/server/app/index.html`), not from source, so what is reported is what a
browser actually receives.

### 2.1 Word counts, actual

`heading` = the `<h1>`/`<h2>`; `body` = the `p.body` paragraphs; `tiny` = the
italic footnote line. The build document's limit ("≤ ~80 words per narrative
section, Technology may reach ~110") is applied to heading + body.

| § | Section | heading | body | **heading+body** | tiny | full rendered (incl. tables/buttons) | Verdict |
|---|---|--:|--:|--:|--:|--:|---|
| 1 | Cover | 1 | 10 | **11** | 0 | 27 | PASS |
| 2 | Problem | 10 | 78 | **88** | 0 | 88 | **8 words over ~80** |
| 3 | Solution | 8 | 70 | **78** | 0 | 78 | PASS |
| 4 | Technology | 10 | 74 | **84** | 15 | 99 | PASS (≤ ~110 allowance) |
| 5 | Model | 6 | 58 | **64** | 0 | 64 | PASS |
| 6 | Market | 9 | 59 | **68** | 13 | 82 | PASS |
| 7 | Competitors | 7 | 32 | **39** | 0 | 109 | PASS (prose 39; rest is the table) |
| 8 | Founders | 9 | 54 | **63** | 0 | 82 | PASS |
| 9 | Roadmap | 10 | 42 | **52** | 0 | 52 | PASS |
| 10 | Explore | 4 | 0 | **4** | 6 | 27 | PASS |

**Problem is 88 words including its heading — 8 over the ~80 limit.** The three
paragraphs alone are 78. Whether this counts as a breach depends on whether the
bold opener counts toward the section budget; the document does not say. Flagging
it rather than deciding it. **No section overflows its screen at 390×844** (§5),
so the practical intent of the rule holds.

### 2.2 Section-by-section, verbatim check

Every Part 4 DISPLAY TEXT string was compared character-for-character against the
rendered output. Straight quotes and apostrophes in the document render as
typographic ones (`'` → `’`, `"…"` → `“…”`) via `&rsquo;` / `&ldquo;` / `&rdquo;`
entities. That is a typesetting choice, not a wording change; it is noted once
here and not repeated per section.

| § | Section | Result |
|---|---|---|
| 1 | Cover | **Match.** "CooL" / "The black box for AI." / "Every change your AI makes — documented, governed, and provable. Automatically." / `[ See it ]` `[ Book a call ]`. **Removals honoured:** no founder names, no "Pre-seed ask ₹1 Cr", no funding line. **Addition — see 2.3.** |
| 2 | Problem | **Exact match, all three paragraphs.** "One ordinary morning, a developer changes a single line in a prompt — thirty seconds of work…" present verbatim. No timestamp, no ten-tool list, no ₹40–60L stat block. |
| 3 | Solution | **Exact match, all three paragraphs.** No ✓ list, no logo grid, no "up to 90%" hero number. |
| 4 | Technology | **Exact match**, both paragraphs plus the italic "*Under the hood — hybrid ML-DSA + Ed25519 signing · tamper-evident transparency log · TEE attestation · control-plane / data-plane split.*" No five separate ✓ promises. |
| 5 | Model | **Exact match.** No pricing table, no dollar figures. |
| 6 | Market | **Exact match**, both paragraphs plus the estimate note. |
| 7 | Competitors opener | **Exact match** — "Everyone tracks AI. No one proves it." |
| 8 | Founders opener | **Exact match** — "The rare intersection: applied post-quantum cryptography and confidential-compute inference." |
| 9 | Roadmap | **Exact match**, both paragraphs. No funding percentages. |
| 10 | Explore | **Exact match** — "See it for yourself." and all four links present in order: See the Studio · Get the SDK · Book a call · Investors. **Addition — see 2.3.** |

### 2.3 Divergences found

**D1 — Competitor mobile row 3 label (character-level divergence).**

Build document, Part 5, mobile version:

> **Neutral across every provider** — CooL ✓ · Others partial

Rendered at <720px (verified on screen and in `Essay.tsx:293`):

> **Works across every provider (neutral)**  CooL ✓ · Others partial

The mobile stack reuses the desktop table's `CAPABILITIES` label rather than the
document's shortened mobile phrasing. It reads correctly and it guarantees both
views can never drift apart (one array feeds both), but it is **not the
document's DISPLAY TEXT.** Also structural, not wording: the document writes
label and comparison on one line joined by `—`; the implementation stacks them on
two lines with no dash.

**D2 — Contact block added beyond the Part 4 DISPLAY TEXT.**

The Cover renders two `tel:` links below the two buttons
(`+91 99428 67200`, `+91 97912 88350`). Explore renders the same two numbers,
plus `Northwind Cipher Pvt. Ltd. · Coimbatore, India` and
`northwindcipher@gmail.com`. None of this is in the Part 4 DISPLAY TEXT for
either section. It came from commit `1846cb0` ("add the contact numbers") and
looks deliberate. It contradicts nothing the document forbids — but it is
content the document did not specify, so it is on the record here for the user
to accept or strike. **I have not touched it.**

**D3 — "Monday 09:14" — gone from the public site, still present on `/why`.**

- `/` and everything under `src/components/essay/`: **zero occurrences.** "One
  ordinary morning" is present, once, exactly as specified.
- Still present outside the public route: `src/app/why/page.tsx` lines 13, 21, 42
  ("It is Monday, 09:14.") and `src/components/why/figures.tsx:79` ("09:14"), plus
  the phrase "Monday morning" in `/dashboard` and `/studio` copy.

Part 8 says *"'Monday 09:14' is gone **everywhere**"*. On the public site it is.
On `/why` it is not. **`/why` is explicitly out of scope for me** — reporting,
not fixing, and not proposing a fix without instruction.

### 2.4 Honesty markers — all intact

| Marker | Where | Rendered text |
|---|---|---|
| Estimate, not benchmark | `/` §Market | *"Market figures are estimates (Grand View Research, Next Move Strategy) — not measured benchmarks."* ✓ both sources named |
| Attestation tier unfinished | `/` §Technology | *"That tier is the one part we mark as still being finished — in the open, not hidden."* ✓ |
| Zero traction | `/investors` §honesty | *"0 paying customers and 0 signed LOIs today. The validation above is real conversations, not commitments."* ✓ verbatim, plus the attestation-tier note and "Named partners and clouds are shared on the call, not written here." |

### 2.5 No lists, no logo walls

- **Numbered/bulleted lists in narrative sections: none.** Built HTML contains
  zero `<ul>`, `<ol>` or `<li>` inside `<main>` on `/`. Every narrative section
  is `<h*>` + `<p class="body">`.
- **Tool-logo walls: none.** No `<img>` on `/` other than the two founder photos.
  Competitor vendor names (Langfuse, Datadog, Credo AI, OneTrust, Vanta, Drata)
  appear as **text inside the comparison table header only** — which is what
  Part 5 specifies — never as logos.

### 2.6 Competitor table — both versions confirmed

| Check | Result |
|---|---|
| Full 6-column table at ≥720px | **PASS.** At 1440px and 1920px: `.cmp-desktop` computed `display: block`, `.cmp-mobile` `display: none`. `thead th` count = **6**, `tbody tr` count = **5**. Screenshot: `wide-competitors.png`. |
| Stacked two-column version below 720px | **PASS, it genuinely exists.** At 390px: `.cmp-mobile` `display: block`, `.cmp-desktop` `display: none`, `.cmp-row` count = **5**. Screenshot: `phone-competitors.png`. |
| Both read the same five capabilities | **PASS, structurally guaranteed.** Both render from one `CAPABILITIES` array (`Essay.tsx:290–296`), so they cannot diverge. |
| Marks correct | **PASS.** All five rows match the document's ✓ / ✗ / ~ / manual / — grid exactly. |
| Table does not break the page | **PASS.** Wrapped in `.tablewrap { overflow-x: auto }`; page has no horizontal overflow at any width tested (§5). |
| Label wording | **See D1.** |

### 2.7 Founder blocks — Part 6

| Check | Result |
|---|---|
| Both present, full detail | **PASS.** Both blocks render name, role, italic field line, three real lines, GitHub handle. Nothing behind a hover. |
| Equal size | **PASS.** At ≥720px `.founders` computes `grid-template-columns: 434px 434px` at 1440px — exactly equal. Below 720px they stack. Screenshot: `wide-team.png`. |
| `loading="lazy"` | **PASS.** Both `<img>` carry `loading="lazy"` in the built HTML. |
| Explicit `width`/`height` | **PASS.** Both carry `width="280" height="280"`. |
| Square crop, `object-fit: cover` | **PASS.** `.avatar { width: clamp(96px,28vw,140px); aspect-ratio: 1/1; object-fit: cover }`. |
| Block never split across the fold | **PASS.** `#team` is `.tall` (`min-height: auto`), measured 1247px at 390×844 — one continuous block, neither founder split. |
| Photos exist and serve | **PASS.** `public/founders/pranauv.jpg` (92,138 B) and `public/founders/kailosh.jpg` (249,824 B); both HTTP 200. |

Two cosmetic notes, not defects: the two source photographs have visibly
different framing and background (one light studio-ish, one dark night scene), so
the *CSS* crop is identical while the *pictures* do not match in feel. And
next/image's non-`srcset` fallback `src` is the `w=3840` variant — irrelevant in
any browser that supports `srcset`, which is all of them.

---

## 3 · Investor gating — checked against the BUILT output

This is the highest-consequence section, so the method is stated in full.

### 3.1 What I searched

**Search terms (15):** `pre-seed`, `post-money`, `Cr pre-seed`, `1 Cr`, `10 Cr`,
`₹` (raw UTF-8), `&#8377;` / `&#x20b9;` / `\u20b9` (encoded), `Lokesh`,
`Proneet`, `Alluri`, `Ayush Kumar`, `Ojas` / `Ojas Tripathi`, `Jio Payments`,
`PayU`, `Use of funds`, `Go-to-Market`, `paying customers`, `signed LOIs`, `SAFE`.

**Files searched:**

1. `.next/server/app/index.html` — the prerendered public page.
2. `.next/server/app/index.rsc` — the public route's RSC flight payload.
3. All **8 JS chunks** the public route requests, resolved by extracting every
   `/_next/static/**/*.js` reference out of `index.html`:
   `1255-cf02c4775860a5ab.js`, `1356-2ed480e29f4f7933.js`,
   `2619-04bc32f026a0d946.js`, `4bd1b696-100b9d70ed4e49c1.js`,
   `app/page-fb312536e9f03617.js`, `main-app-92e2ab7d750e90cb.js`,
   `polyfills-42372ed130431b0a.js`, `webpack-b172b04cd0d0f5e0.js`.
4. `.next/static/**` in full — to find which chunk, anywhere, carries the terms.
5. `.next/server/app/sitemap.xml.body` — the generated sitemap.
6. `.next/server/app/robots.txt.body` — the generated robots.txt.
7. Every `<meta>` tag emitted on `/` (OpenGraph, Twitter, description, keywords).
8. `src/app/opengraph-image.tsx` — the OG image generator source.
9. **Every** prerendered `.html` in `.next/server/app/`, all 14 of them.

### 3.2 Result on the public route: **CLEAN**

**Zero hits, all 15 terms, in every one of:** `index.html`, `index.rsc`, all 8
public JS chunks, `sitemap.xml`, `robots.txt`, `/`'s OpenGraph and Twitter
metadata, and the OG image generator source. The rupee sign does not appear on
`/` in raw or any encoded form.

**Sitemap:** 9 URLs — `/`, `/deck`, `/why`, `/demo`, `/pipeline`, `/dashboard`,
`/studio`, `/sdk`, `/billboard`. **Neither `/investors` nor `/investors/diligence`
is listed.** Correct, and `src/lib/site.ts:38–42` documents why.

**robots.txt:** `Allow: /`, `Disallow: /_next/static/chunks/` and `/api/`. No
investor path is named — which is the right call, since naming a private path in
robots.txt advertises it.

**`/investors` meta robots:** `noindex, nofollow, nocache`. ✓
**`/investors/diligence` meta robots:** `noindex, nofollow`. ✓

### 3.3 Three leaks found elsewhere. One is serious.

#### **LEAK 1 — HIGH — the raise terms are on `/deck`, which is public and in the sitemap.**

`.next/server/app/deck.html`, in the **rendered DOM** (not a payload, not a
comment — actual visible page text):

```html
<p class="mt-1 max-w-[38ch] text-[13px] leading-relaxed text-mist">₹1 Cr pre-seed · SAFE at a ₹10 Cr cap · twelve months to revenue.</p>
```

Source: `V2/src/slides/S11Next.tsx:93`.

Why this matters, concretely:

- `deck.html` carries `<meta name="robots" content="index, follow"/>`.
- `/deck` **is** in `sitemap.xml`, at priority 0.7 — the site actively invites
  crawlers to it.
- `robots.txt` allows it.
- The same string is in the public chunk `app/deck/page-09dc31c176e25db1.js`.

Build document Part 1 rule 8 — *"No raise terms … on public pages."* Part 4 §1 —
*"Remove: … 'Pre-seed ask ₹1 Cr,' any funding line."* The public **essay** honours
both. `/deck` does not, and `/deck` is a public page that the sitemap submits for
indexing. This is precisely the failure the whole gating design exists to
prevent: the SAFE cap surfacing in search next to the product.

Named validators are **not** on `/deck` — 0 hits for all five names. It is the
raise line only.

`/deck` is outside my stated file ownership (`src/slides/**`). **Not fixed.**
Escalating it is the point of this report.

#### **LEAK 2 — MEDIUM — the `/investors` gate does not remove the material from the response.**

`InvestorGate` is a client component that receives the gated sections as
`children`. Next serialises those children into the RSC flight payload embedded
in the HTML **regardless of whether the component renders them**. Verified two
ways:

Static output — `.next/server/app/investors.html` and `investors.rsc` both
contain, escaped inside a `self.__next_f.push(...)` chunk:

```
{"className":"opener","children":"₹1 Cr pre-seed — SAFE, ₹10 Cr post-money cap. A twelve-month runway to seed."}
```

…and all five validator names, the full use-of-funds list, and
`0 paying customers and 0 signed LOIs`.

Live, in the browser, gate showing and passcode never entered:

```
{ gatePresent: true,
  askVisibleInDom: false,          // the gate really does hide it visually
  rawHtmlHasRaise: true,           // …but it is in the served HTML
  rawHtmlHasValidator: true }
visibleText: "Investors The raise, the use of funds, the detailed roadmap and named
              validation sit behind this. Ask us for the passcode…"
```

So `curl https://northwindcipher.com/investors | grep pre-seed` returns the raise
terms with no passcode. The component's own header comment already says it is
"not a security boundary" and that "what actually protects it is `noindex`" — that
is honest and correct as far as it goes. What is worth surfacing to the user is
that the gate provides **not even obscurity**: it stops a customer *browsing* into
the material, and stops nothing else. The `noindex, nofollow, nocache` is doing
100% of the real work.

#### **LEAK 3 — MEDIUM — `/investors/diligence` has no gate at all.**

`src/app/investors/diligence/page.tsx` renders `<InvestorKeynote />` **directly**,
with no `InvestorGate` wrapper. Anyone with the URL sees the full keynote — no
passcode prompt, not even the client-side one. Its chunk
(`app/investors/diligence/page-e5622e174d9216b4.js`) carries `pre-seed`,
`post-money`, `1 Cr`, `10 Cr`, and **all five validator names**.

Additionally its own `<meta name="description">` contains the raise figure:

> "…what we refuse to build ourselves, and exactly what **₹1 Cr** converts into."

…and its OpenGraph description likewise. Metadata is what a link preview renders,
so pasting that URL into Slack or a DM surfaces the raise figure in the unfurl.
Protection is `noindex, follow: false` and sitemap exclusion — nothing else.

The task brief listed `/investors/diligence` as "gated investor material". **It is
not gated.** Correcting that expectation is the point of naming it here.

#### Summary table

| Surface | Raise terms | Named validators | Indexable | In sitemap |
|---|:--:|:--:|:--:|:--:|
| `/` (html, rsc, 8 chunks, meta, OG) | **no** | **no** | yes | yes |
| `sitemap.xml` | **no** | **no** | — | — |
| `robots.txt` | **no** | **no** | — | — |
| **`/deck`** | **YES — rendered DOM** | no | **YES** | **YES (p 0.7)** |
| `/investors` | yes (RSC payload) | yes (RSC payload) | no | no |
| `/investors/diligence` | yes (chunk + meta description) | yes (chunk) | no | no |
| all other prerendered routes | no | no | — | — |

---

## 4 · Scroll-trap audit

### 4.1 The invariant, in the BUILT stylesheet

From `.next/static/css/c7ec09bead535aac.css` — the stylesheet `/` actually loads:

```css
html{overscroll-behavior-y:contain;background:var(--color-void);color-scheme:dark;
     scroll-behavior:smooth;-webkit-text-size-adjust:100%;overflow:hidden visible}
html{height:auto;margin:0;padding:0}
}body{overflow-x:clip}
}body{background:var(--color-void);color:var(--color-fog);
      font-family:var(--font-sans);min-height:100svh}
```

**`overflow: hidden visible` is exactly the expected shorthand** — Lightning CSS
collapsed `overflow-x: hidden; overflow-y: visible` into it. `body` is
`overflow-x: clip` and nothing else; `overflow-y` is never set on body, so it
stays `visible` and **body never becomes a scroll container**. `overscroll-behavior-y:
contain` appears on `html` only. `height` on both is `auto`, never `100vh`.
**Invariant holds.**

### 4.2 The invariant, at runtime, at 390×844

```
scrollingElement:      "html"
html  overflow:        "hidden auto"   (x:hidden, y:auto — html IS the scroller)
body  overflow-x:      "clip"
body  overflow-y:      "visible"
body is a scroll container: false
html overscroll-behavior-y: "contain"
html scroll-snap-type: "none"
[data-app-shell] elements on /: 0
document.scrollWidth 390 === clientWidth 390  → no horizontal overflow
```

`html:has([data-app-shell]){overflow:hidden}` **cannot** match on `/` — the only
element carrying that attribute is `StudioShell.tsx:91`, which renders on
`/studio` alone. Confirmed 0 in both `index.html` and the live DOM.

### 4.3 `src`-wide greps

| Pattern | Result |
|---|---|
| `mandatory` snap | **No vertical mandatory snap anywhere.** All 5 code hits are `snap-x snap-mandatory` on **horizontal** rails inside their own `overflow-x-auto` boxes (`Scroller.tsx:44`, `TestimonialRail.tsx:71`, `ui/testimonial-carousel.tsx:178`) — none on `/`. The 3 hits in `globals.css` and 2 in `SnapScroll.tsx` are prose in comments. |
| `100vh` | **One hit**, `studio/views/LedgerView.tsx:219` (`h-[calc(100vh-3rem)]` on a `/studio` side panel). **Zero on any section or scroll root.** The essay uses `min-height: 100svh`, which is the correct choice and is documented at `globals.css:1094`. |
| `overflow: hidden` on a wrapper in the public path | **None.** The only `overflow` in `src/components/essay/**` or `src/app/page.tsx` is `overflowX: "auto"` on the nav's own link row (`EssayNav.tsx:46`) — intended, scoped to a 52px bar. |
| Snapping on `/` | `scroll-snap-type` is `none` on `/`. `y proximity` is scoped to `html[data-deck]`, which `SlideRail` sets only on the deck. **No snapping added, and none should be.** |

### 4.4 One latent hazard worth naming (not a bug today)

`globals.css:1126` puts `scroll-snap-align: start` on **every** `.essay section`.
With no snap container on `/` this is completely inert — the runtime check above
confirms `scroll-snap-type: none`. But the snap *points* are pre-laid. If anyone
ever adds `scroll-snap-type` to `html` for the essay — including via a
copy-pasted `data-deck`, or a "let's try proximity" experiment — ten full-height
snap points activate instantly, and the `.tall` founders section (measured 1247px
> 844px viewport) is exactly the taller-than-viewport case the file's own comment
at line 136 warns produces a trap. It is safe now; it is one line away from not
being. Recommend it be deleted or commented as deliberately inert, but **that is
a code change and I made none.**

---

## 5 · Reproducing the scroll bug

**Result: the bug does NOT reproduce.** Detail, including a false positive I had
to rule out, follows.

### 5.1 Harness

Chrome (`--headless=new`, and separately headful) driven over raw CDP.
`Emulation.setDeviceMetricsOverride` at **390×844, DPR 3, `mobile: true`**, plus
`setTouchEmulationEnabled` and `setEmitTouchEventsForMouse`. Target: the
**production build** served by `next start -p 3002`, not the dev server.
**This is device emulation, not a phone.**

### 5.2 A false positive, and the control that killed it

My first pass used `Input.synthesizeScrollGesture` with
`gestureSourceType: "touch"`. Thirty swipes; **`scrollY` was `0` after every
single one** — an exact match for the reported symptom, and for the "16 full
swipes, scrollY never left 0" line in the `globals.css` comment.

It was wrong. I ran the identical gesture, in the same browser, against a control
page — `data:text/html,<div style="height:9000px">` with no CSS at all, which
cannot possibly have the bug:

| Input method | Control (plain 9000px page) | `/` (the site) |
|---|--:|--:|
| `synthesizeScrollGesture` (touch) | **0** | **0** |
| `dispatchTouchEvent` drag ×3 | 2053 | **2666** |
| `dispatchMouseEvent` wheel ×3 | 4523 | **1807** |
| `scrollTo(0,4000)` | 4000 | **4000** |

The control does not scroll under `synthesizeScrollGesture` either. **That API is
broken in this environment** (it needs compositor frames this harness does not
drive) — it is a harness limitation, not a page defect. Re-ran the whole thing
**headful**, same outcome: control 0, site 0, while raw touch drags moved the site
**4447px**. Had I reported the first pass, I would have reported a bug that does
not exist.

Recording this because "the tool returned zero" and "the page is trapped" look
identical until you run the control.

### 5.3 The actual journey — top → bottom → top at 390×844

Real touch drags (`Input.dispatchTouchEvent` `touchStart`/`touchMove`×12/`touchEnd`)
scroll the page normally. For a precisely measurable 40-step journey I used wheel
events:

**Down**, `scrollY` after each of 40 gestures:

```
500 1000 1500 2000 2500 3000 3500 4000 4500 5000 5500 6000 6500 7000 7500 8000
8052 8052 8052 8052 8052 8052 8052 8052 8052 8052 8052 8052 8052 8052 8052 8052
8052 8052 8052 8052 8052 8052 8052 8052
```

- Strictly monotonic increasing. **No dead-stop, no snap-back, no trap.**
- Final `scrollY` **8052** = `scrollHeight (8896) − innerHeight (844)` **exactly**.
  The document bottom is reached, to the pixel.
- `#explore`, the last section: `{ top: 0, bottom: 844, vh: 844, fullyVisible: true }`
  — the last screen is **fully visible, not cut off**. That is `100svh` doing its job.

**Back up**, 40 gestures:

```
7552 7052 6552 6052 5552 5052 4552 4052 3552 … 0 0 0 0 0
```

- Strictly monotonic decreasing. Returns to `scrollY === 0`. Confirmed both
  headless and headful, and independently at 500×900.

Section geometry at 390×844 (`top` / `height`):

```
cover 53/844 · problem 897/844 · solution 1741/844 · technology 2585/844
model 3429/844 · market 4273/844 · competitors 5117/844 · team 5961/1247
roadmap 7208/844 · explore 8052/844          document height 8896
```

Nine sections at exactly one viewport; `#team` at 1247px, which the document
explicitly permits.

**Conclusion: given `e3e143e`, the mobile scroll trap does not reproduce under
390×844 emulation. Every scroll invariant that fix established still holds, in
the built CSS and at runtime.** This is emulation. It is not proof about iOS
Safari.

### 5.4 Screenshots captured

Under the session scratchpad, `…/scratchpad/out/`:

| File | What |
|---|---|
| `phone-top.png` | 390×844 @3x, cover |
| `phone-bottom.png` | 390×844, after the full downward journey |
| `phone-market.png`, `phone-competitors.png`, `phone-team.png`, `phone-explore.png` | 390×844, each dense section |
| `phone-full.png` | 390px full-page, all 8896px |
| `desktop-top.png`, `desktop-competitors.png` | 1440×900 |
| `wide-top.png`, `wide-competitors.png`, `wide-team.png` | 2560×1440 / 1920×1080 |

Reviewed: cover, competitors (both variants), founders, market. Layout is clean at
every width; no overlap, no clipping, no spill.

---

## 6 · Part 8 QA checklist

### Scroll (the reported bug)

| Item | Verdict | Evidence |
|---|---|---|
| Swipe top → last section → back up, no dead-stop, no trap | **PASS (emulated)** | §5.3. Monotonic both ways; `scrollY` 0 → 8052 → 0; 8052 is the exact document max. **Not verified on a real phone — impossible here.** |
| No `overflow:hidden` / `100vh` fixed heights on `html`, `body`, wrappers | **PASS** | §4.1/§4.3. Built CSS: `html{overflow:hidden visible}`, `body{overflow-x:clip}`, both `height:auto`. Zero `100vh` on any scroll root or section. |
| Snapping is `proximity` or off, never `mandatory` | **PASS** | `/` computes `scroll-snap-type: none`. `y proximity` is scoped to `html[data-deck]`. No vertical `mandatory` anywhere. Latent hazard noted at §4.4. |
| Last section fully visible, not cut off by the address bar | **PASS (emulated)** | `#explore` at scroll end: `top 0, bottom 844, vh 844, fullyVisible: true`. Uses `min-height:100svh`. **The address-bar behaviour this tests for only exists on a real phone — NOT-TESTABLE-HERE.** |

### Layout / spacing / overlap

| Item | Verdict | Evidence |
|---|---|---|
| Content vertically centred, fits one screen (≤ ~80 words) | **PASS with one exception** | All 10 sections `display:flex; justify-content:center`. Content height vs 844px viewport: cover 375, problem 473, solution 473, technology 506, model 352, market 696, competitors 565, roadmap 390, explore 394 — **none overflows**; `team` 1078 in a 1247px `.tall` section, permitted. Word-count exception: **Problem 88 (≥80)**, §2.1. |
| No text overlaps another element on any width | **PASS** | Programmatic pairwise bounding-box intersection over every block element in every `.wrap` at 390px: **0 overlapping pairs.** Visually confirmed at 390 / 1440 / 1920 / 2560. |
| No horizontal scrollbar anywhere | **PASS** | `scrollWidth === clientWidth` at **390** (390=390), **1440**, **1920** and **2560**. The wide table scrolls inside `.tablewrap`, never the page. |
| Consistent gaps from the spacing scale | **PASS (by inspection)** | `--s1…--s5` defined at `globals.css:1102–1106` and used throughout `Essay.tsx`; I found no freehand margins in the essay components. |
| Notch / safe-area respected | **PARTIAL — code PASS, device NOT-TESTABLE-HERE** | `env(safe-area-inset-*)` is applied on section padding (`globals.css:1133–1134`), the nav (`EssayNav.tsx:33,44`). **Emulation does not simulate a notch inset; I cannot confirm the visual result. Requires a real device.** |

### Type / sizing

| Item | Verdict | Evidence |
|---|---|---|
| Openers/body scale smoothly 360px → desktop | **PASS** | `clamp(27px,7.4vw,50px)` / `clamp(16px,4.3vw,20px)` — the document's own values, verbatim. Rendered legibly at 390, 1440, 1920, 2560; nothing tiny, nothing giant. Two short-viewport tiers (`max-height:900px`, `720px`) tighten spacing without shrinking type. |
| Tap targets ≥ 48px | **FAIL (marginal) — 9 links are 44px** | Measured at 390px. The five `.btn` elements are 48px ✓. **44px:** nav wordmark "CooL"; nav "Book a call"; both `tel:` links on Cover; both `tel:` links on Explore; both GitHub links; the `mailto:` link. 44px is deliberate and commented (`Essay.tsx:28–33`) and meets Apple HIG's 44pt; the build document asks for **48**. Reporting it as a miss against the document, not as a usability defect. |

### Content correctness

| Item | Verdict | Evidence |
|---|---|---|
| "Monday 09:14" gone everywhere → "one ordinary morning" | **PASS on `/` · FAIL on `/why`** | §2.3 D3. Zero on the public site; "one ordinary morning" present verbatim. 4 occurrences remain on `/why` (out of my scope). |
| No numbered/bulleted lists in narrative sections | **PASS** | Zero `<ul>`/`<ol>`/`<li>` inside `<main>` on `/`. |
| No tool-logo walls | **PASS** | Zero images on `/` except the two founder photos. Vendor names are table text only. |
| **No raise terms on public pages** | **FAIL** | §3.3 LEAK 1. `/` is clean; **`/deck` renders "₹1 Cr pre-seed · SAFE at a ₹10 Cr cap"** and is `index, follow` + sitemapped. |
| **No named partners/validators on public pages** | **PASS** | All five names: zero hits across `/`, the sitemap, robots, and every other prerendered public HTML. Confined to `/investors` and `/investors/diligence`, both `noindex` and both excluded from the sitemap. |
| Competitor table readable on mobile via the stacked version | **PASS** | §2.6 + `phone-competitors.png`. Label wording diverges — D1. |
| Both founder blocks, full detail, real photos, equal size | **PASS** | §2.7. `grid-template-columns: 434px 434px`. |
| Honesty markers present | **PASS** | §2.4. All three intact and verbatim. |

### Function

| Item | Verdict | Evidence |
|---|---|---|
| Every link resolves, nothing 404s | **PASS** | All 19 `href`s on `/` enumerated and checked. Internal: `/` 200, `/demo` 200, `/studio` 200, `/sdk` 200, `/investors` 200, `/investors/diligence` 200, `/sitemap.xml` 200, `/robots.txt` 200, `/opengraph-image` 200, both founder photos 200. External `https://cal.com/coolnwc` → 200. Anchors `#cover #solution #technology #market #team` all resolve to real section ids. `tel:` ×4 and `mailto:` ×1 well-formed. |
| Investor gate works | **PASS functionally, with the §3.3 caveat** | Gate renders, hides `#ask` from the DOM, offers passcode + "Request access" mailto. **But the material is in the served HTML regardless — LEAK 2.** |
| Images have `width`/`height` + `loading="lazy"`; no jump as they load | **PASS** | Both `<img>`: `loading="lazy" width="280" height="280"`, plus `aspect-ratio: 1/1` in CSS. Intrinsic size declared, so no CLS from the photos. |
| Loads in under ~2s on mobile data | **NOT-TESTABLE-HERE** | No throttled real-network test, and **no Lighthouse** (see the preamble — I did not run it and have not estimated a score). Measured wire bytes instead, from `next start` with gzip on: HTML **10.9 kB** (57.3 kB uncompressed), CSS **23.0 kB** (128 kB uncompressed), JS **112 kB** across 8 chunks — matching the build's *111 kB First Load JS*. Founder photos at `w=640`: **25 kB** + **83 kB**, and both are `lazy` so they are off the critical path. Total critical path ≈ **146 kB**. That is a small page. Whether it lands under 2s on real mobile data is a claim I have not measured and will not make. |

### Cross-device

| Item | Verdict |
|---|---|
| Re-run the whole list on **iOS Safari** | **NOT-TESTABLE-HERE.** No iOS device, no Safari. This is the browser where `overflow` and `overscroll-behavior` differ most, and where the URL-bar collapse that `100svh` addresses actually happens. Untested. |
| Re-run on **Android Chrome** (real device) | **NOT-TESTABLE-HERE.** Emulation ≠ device. |
| **Desktop Chrome** | **PASS.** Verified at 1440×900, 1920×1080, 2560×1440 — no overflow, no overlap. |
| **One narrow + one wide window** | **PASS.** 390×844 and 2560×1440 both clean; identical content, correct responsive switch at the 720px breakpoint. |

### Tally

| | Count |
|---|--:|
| **PASS** | **19** |
| **PASS with a noted exception** | 2 (section-fit / Problem word count; investor gate + LEAK 2) |
| **PARTIAL** (code correct, device unverifiable) | 1 (safe-area) |
| **FAIL** | **3** — raise terms on `/deck`; "Monday 09:14" on `/why`; 44px vs 48px tap targets |
| **NOT-TESTABLE-HERE** | **5** — real-phone scroll; address-bar cut-off on device; <2s on mobile data; iOS Safari; Android Chrome |

**Not one item is marked passed that I did not actually run.**

---

## 7 · Proposed enhancement plan — proposal only, nothing built

Ordering principle from the build document: **guardrails beat effects**. Every
layer below states the guardrail that rolls it back, and every layer is one
commit that can be reverted alone. Baseline to beat: **`/` = 5.36 kB route,
111 kB First Load JS, no client boundary, 0 JS on the critical path.**

### Layer 0 — Fix what the audit found, before adding anything

Not an enhancement; a correctness gate on everything after it.

1. **LEAK 1 — the raise line on `/deck`.** Highest consequence in this report and
   the only true public leak. `src/slides/S11Next.tsx:93` is **Session A's tree,
   not mine** — needs the user's call on who fixes it. Options: remove the line;
   or set `robots: { index: false }` on `/deck` and drop it from `ROUTES`;
   or move it behind the gate. **Escalating, not deciding.**
2. **LEAK 3 — `/investors/diligence` is ungated.** Wrap it in `InvestorGate`
   (matches the brief's stated intent) and strip "₹1 Cr" from its
   `description`/OG description so link unfurls stop carrying the figure.
3. **LEAK 2** — decide whether client-side gating is accepted. If the RSC payload
   must not carry the material, the fix is a server boundary; if `noindex` is
   accepted as sufficient, say so in the code comment so nobody later mistakes
   the gate for protection.
4. **D1** — one-word decision: adopt the document's mobile label, or record the
   current wording as an accepted deviation.
5. **§4.4** — delete the inert `scroll-snap-align: start`, or annotate it.

*Guardrail:* re-run the exact §3.1 grep set. Any hit on `/` or any indexable
route ⇒ revert.

### Layer 1 — Design system (substitute skill: `ui-ux-pro-max`, **not** `zanwie/design-dna`, which is unavailable)

Consolidate the ~40 inline `style={{…}}` objects in `Essay.tsx` and `EssayNav.tsx`
into the `.essay` token scope already in `globals.css`. Tighten the type ramp,
optical alignment, and the `max-height:900px/720px` tiers. **Zero visual
redesign, zero copy change, zero new dependency.** This is the cheapest real
quality gain on the page and it is pure CSS.

*Guardrails:* (a) `/` First Load JS stays **111 kB** — a design layer that adds
JS is not a design layer; (b) all §2.1 word counts unchanged; (c) `scrollWidth ===
clientWidth` at 390/1440/2560; (d) no overlapping pairs; (e) the §4.1 built-CSS
invariant byte-identical. Any miss ⇒ revert the commit.

### Layer 2 — GSAP scroll reveals (`gsap` + `@gsap/react`, both installed)

The page's own header comment says it is deliberately static so "what a crawler
receives and what a phone on a slow connection receives are the same thing the
reader sees." **Any reveal layer breaks that promise**, so it must be built the
only way that keeps it: content ships visible in the HTML, and a `useGSAP`
effect *opts into* animating only after mount, only on `(pointer:fine)` and
`(prefers-reduced-motion: no-preference)`. Never `opacity:0` in the initial
markup. Suggested scope: openers and body paragraphs, ≤200ms, ≤12px translate,
opacity+transform only, ScrollTrigger `once: true`.

*Guardrails:* (a) **JS disabled ⇒ page is 100% readable and visually identical to
today** — the acceptance test, not a nicety; (b) `prefers-reduced-motion: reduce`
⇒ nothing animates (the `[data-reveal]` reset at `globals.css:811` already
exists); (c) First Load JS ceiling **+25 kB over 111 kB**; (d) `scrollY` still
traverses 0 → max → 0 monotonically at 390×844 with ScrollTrigger mounted —
**ScrollTrigger creating a second scroll context, or pinning, is an instant
revert**; (e) no `scroll-snap-type` introduced. Any miss ⇒ revert.

### Layer 3 — Exactly one three.js motif (`three` + `@react-three/fiber` + `@react-three/drei`, all installed)

**One**, and it must earn its bytes. The only honest candidate is the Market
rings (`MarketRings`) — already an area-accurate SVG with a good comment about
why radius-scaling would flatter. A 3D version must preserve `r ∝ √v` exactly or
it becomes the dishonest graphic that comment exists to prevent. Everywhere else
on this page, 3D is decoration on an essay.

**My recommendation is to skip this layer.** The SVG is correct, accessible
(`role="img"` + a full `aria-label`), weighs ~0 kB, and works with JS off. Three.js
would cost ~150 kB+ to render a picture that is already right. If the user wants
it anyway, it must be `next/dynamic({ ssr: false })` with the SVG as the
permanent, non-JS fallback.

*Guardrails:* (a) route-level dynamic import — **`/`'s First Load JS must not move
at all**; (b) SVG fallback renders with JS off and under reduced-motion; (c) no
WebGL context on mobile widths (a phone GPU spun up for a decorative ring is a
battery cost the reader did not ask for); (d) area-scaling assertion holds. Any
miss ⇒ revert.

### Layer 4 — Motion polish (substitute skill: `framer-motion-animator`, **not** "motion-design", which does not exist)

Only after 1–3 are green: focus-visible rings, `:active` button feedback (already
present as `translateY(1px)`), nav backdrop transition, `tel:`/`mailto:` hover
affordance. CSS transitions, no new library — `framer-motion` is not currently a
dependency and **adding it would require editing `V2/package.json`, which is
Session A's file. I will not propose that.**

*Guardrails:* (a) every animation transform/opacity only; (b) all killed under
`prefers-reduced-motion`; (c) no new dependency; (d) First Load JS unchanged.

### Cross-cutting gate, run before every one of these commits

```
npm run build      # / must stay 5.36 kB / 111 kB unless the layer's own ceiling says otherwise
npm run typecheck  # must stay clean
```
plus: the §3.1 leak grep, the §4.1 built-CSS invariant, and the §5.3 scroll
journey at 390×844. **A layer that cannot pass all four does not ship.** Any
regression in the scroll invariant reverts immediately and unconditionally — the
whole point of `e3e143e` is that this bug is the one that must never come back.

---

## 8 · Files read, and files not touched

**Read (mine):** `V2/src/app/page.tsx`, `layout.tsx`, `globals.css`, `sitemap.ts`,
`robots.ts`, `opengraph-image.tsx`, `investors/page.tsx`,
`investors/diligence/page.tsx`; `V2/src/components/essay/{Essay,EssayNav,InvestorGate}.tsx`;
`V2/public/founders/`.

**Read only, never edited (Session A's, or out of scope):** `V2/src/lib/**`,
`V2/src/slides/S11Next.tsx`, `V2/src/components/investors/**`,
`V2/src/components/studio/**`, `V2/src/app/why/**`, `V2/package.json`,
`V2/package-lock.json`, `V2/tests/**`, `V2/scripts/**`, `V2/packages/**`.

**Written:** this file only.

---

*Nothing in this report was inferred where it could be measured. Where a number
could not be measured — Lighthouse, real-device behaviour, mobile-network load
time — it is absent, and the reason is stated. Emulation is never reported as a
phone.*
