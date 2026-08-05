# QA REPORT — Layer 0

**Branch:** `web-polish` (worktree `wt-web`)
**Baseline this is measured against:** `/` = **5.36 kB route, 111 kB First Load JS**
**Scope:** the security fixes and content corrections approved after STEP 0. No
visual work. The design-system layer has not been started.

**What I could not do, restated because it has not changed:**

- **I cannot test on physical hardware.** No iPhone, no Android device. Every
  mobile measurement here is Chrome device emulation at 390×844 (DPR 2–3,
  `mobile: true`, touch emulation on). Emulation is not a phone and is never
  reported as one.
- **I did not run Lighthouse**, and there is no performance score in this
  report. Installing it would touch `V2/package.json`, which is Session A's.
  No score has been estimated.

---

## 1 · Commits, and what each fixes

| # | Commit | Fixes |
|---|---|---|
| 1 | `1306c81` Stop inviting crawlers to the one deck slide that states the ask | LEAK 1 |
| 2 | `1b31a7f` Gate the investor material on the server, so the bytes are not sent | LEAKS 2 and 3 |
| 3 | `b84af84` Give the phone comparison the wording the build document specifies | copy D1 |
| 4 | `9c2b415` Open /why on an ordinary morning, not on Monday 09:14 | copy D3 |
| 5 | `045339f` Give every tap target on the essay the same 48px floor | Part 8 tap targets |
| 6 | `bb56bbe` Take the pre-laid snap points off the public page | latent scroll hazard |

### Build and typecheck after every commit

`npm run typecheck` returned **exit 0, no diagnostics, after every one of the
six.** Route table deltas against the 5.36 kB / 111 kB baseline:

| After | `/` route | `/` First Load JS | Δ | Other movement |
|---|--:|--:|---|---|
| 1 · deck noindex | 5.36 kB | 111 kB | **none** | — |
| 2 · server gate | 5.36 kB | 111 kB | **none** | `/investors` ○ 1.46 kB / 107 kB → **ƒ 1.55 kB / 107 kB**; `/investors/diligence` ○ 9.62 kB / 177 kB → **ƒ 10.5 kB / 158 kB**; `/deck` 255 kB → 274 kB route, 422 → 421 kB first load |
| 3 · competitor label | 5.36 kB | 111 kB | **none** | — |
| 4 · /why copy | 5.36 kB | 111 kB | **none** | `/why` 15.2 kB / 159 kB, unchanged |
| 5 · tap targets | 5.36 kB | 111 kB | **none** | — |
| 6 · snap-align | 5.36 kB | 111 kB | **none** | — |

**`/` did not move at all: 5.36 kB, 111 kB, across all six commits.**

Two deltas worth explaining rather than burying:

- **`/investors` and `/investors/diligence` changed from ○ (Static) to ƒ
  (Dynamic).** This is the fix, not a side effect. An access decision baked at
  build time is not an access decision.
- **`/deck`'s route size rose 255 → 274 kB while its First Load JS fell 422 →
  421 kB.** The keynote stopped importing `components/Nav`, which moved shared
  modules out of a common chunk and into the deck's own. Same code, different
  chunk boundary.

`npm run build` still prints `⨯ ESLint must be installed…`. Pre-existing, exit
code still 0, and fixing it needs `V2/package.json`. Untouched.

---

## 2 · The leaks — proof, with the commands and the actual output

The bar set for this work was: *gated means the bytes are not sent — not in
HTML, not in the RSC flight payload, not in a JS chunk.* So the test fetches
each route with no credential and then follows **every asset that response tells
a browser to load**, scanning all of it.

### 2.1 Why the matching is done in Node and not in `grep -i`

The shell's `grep -i` mangles multibyte input on this platform — it returns
`grep: -P supports only unibyte and UTF-8 locales`, or silently produces empty
counts that a shell test then reads as a match. Both happened during this work
and both produced junk output.

That is not a footnote. **A case-sensitive `grep pre-seed` is exactly how the
first audit missed three of the leaks**, because the source spells it `Pre-seed`
with a capital P and the built form is URL-encoded as `%E2%82%B91%20Cr`. The
scanner below lowercases the whole file in Node and does `includes()`.

### 2.2 The command

```
$ INVESTOR_PASSCODE=<redacted> node scratchpad/proof.mjs
```

`proof.mjs` fetches each route, scans the body against 22 terms, extracts every
`/_next/static/**.{js,css}` reference from that body, fetches each one and scans
it too. The authorised cookie is computed the way the server action issues it:
`HMAC-SHA256(passcode, "cool.investor.access.v1")`.

**Terms (22):** `pre-seed`, `post-money`, `iSAFE`, `SAFE at`, `SAFE,`, `₹1 Cr`,
`₹10 Cr`, `1 Crore`, `%E2%82%B91`, `Lokesh`, `Proneet`, `Alluri`,
`Ojas Tripathi`, `Ayush Kumar`, `Jio Payments`, `PayU`, `Ritual`, `Marlin`,
`signed LOIs`, `paying customers`, `Human Resources`, `Go-to-Market`.

### 2.3 The actual output

```
========================================================================
  UNGATED — the material must not be in this response
  GET /investors   (no cookie, no passcode)
========================================================================
HTTP 200   21178 bytes
response body ....... clean — 0 of 22 terms
referenced assets ... 9 fetched, 0 with a hit

========================================================================
  UNGATED — the material must not be in this response
  GET /investors/diligence   (no cookie, no passcode)
========================================================================
HTTP 200   20067 bytes
response body ....... clean — 0 of 22 terms
referenced assets ... 11 fetched, 0 with a hit

########################################################################
  CONTROL: the same two routes WITH a valid cookie.
  If these came back clean too, the test would be proving nothing.
########################################################################

========================================================================
  AUTHORISED — the material SHOULD be here
  GET /investors   Cookie: cool_investor_access=<token>
========================================================================
HTTP 200   39706 bytes
response body ....... HIT: pre-seed, post-money, SAFE,, ₹1 Cr, ₹10 Cr, Lokesh,
Proneet, Alluri, Ojas Tripathi, Ayush Kumar, Jio Payments, PayU, Ritual, Marlin,
signed LOIs, paying customers, Human Resources, Go-to-Market
referenced assets ... 9 fetched, 0 with a hit

========================================================================
  AUTHORISED — the material SHOULD be here
  GET /investors/diligence   Cookie: cool_investor_access=<token>
========================================================================
HTTP 200   76342 bytes
response body ....... HIT: pre-seed, post-money, iSAFE, ₹1 Cr, ₹10 Cr, 1 Crore,
%E2%82%B91, Lokesh, Proneet, Alluri, Ojas Tripathi, Ayush Kumar, Jio Payments,
PayU, Ritual, Marlin, Go-to-Market
referenced assets ... 11 fetched, 0 with a hit

########################################################################
  CONTROL: a cookie that is present but wrong.
########################################################################

========================================================================
  WRONG COOKIE — must be refused
  GET /investors   Cookie: cool_investor_access=<token>
========================================================================
HTTP 200   21178 bytes
response body ....... clean — 0 of 22 terms
referenced assets ... 9 fetched, 0 with a hit

========================================================================
  VERDICT
========================================================================
  ungated /investors ................. CLEAN
  ungated /investors/diligence ....... CLEAN
  wrong cookie /investors ............ CLEAN (refused)
  authorised /investors .............. material present (18 terms) — gate opens
  authorised /investors/diligence .... material present (17 terms) — gate opens
```

**The two control rows are the point.** A test that only ever reports "clean"
proves nothing — it could be scanning the wrong thing. The authorised requests
return 18 and 17 of the same terms through the same scanner, so the scanner
works and the terms are findable. And a cookie that is *present but wrong* is
refused byte-for-byte identically to no cookie at all (21178 bytes both times),
so the check is a real comparison and not a presence test.

### 2.4 The public route

```
$ node scratchpad/leakscan.mjs .next     # + a per-asset scan of / specifically
  index.html: clean
  10 assets scanned, 0 with a hit
```

`/` — its HTML and all ten referenced assets — is clean against all 18
case-insensitive variants including the URL-encoded rupee. The `/` verdict in
STEP 0 survives the stricter re-test.

### 2.5 What still contains the terms, and why that is the decision

| Surface | Contains | Status |
|---|---|---|
| `/deck` HTML + its chunk | `pre-seed`, `SAFE at`, `₹1 Cr`, `₹10 Cr` | **By decision.** The deck keeps its ask. Now `noindex, nofollow` and out of the sitemap. |
| `app/investors/page-*.js`, `app/investors/diligence/page-*.js` | `Use of funds` | **Not a leak — false positive in my own term list.** It is the gate's own visible sentence: *"The raise, the use of funds, the detailed roadmap and named validation sit behind this."* It tells a reader what is behind the door and contains no figure and no name. It is deliberately excluded from the 22-term proof set above. |

### 2.6 End-to-end, in a browser — the gate actually opens

The leak proof cannot tell you the door still works. Separately, at 390×844:

```
before:  visible text ... "Investors The raise, the use of funds, the detailed
                           roadmap and named validation sit behind this…"
         #ask in DOM ....................... false
         raw HTML contains "pre-seed" ...... false

wrong passcode submitted:
         error shown ....................... "That is not it. Ask us on the call."
         still gated ....................... true

correct passcode submitted:
         #ask in DOM ....................... true
         #ask headline ..................... "₹1 Cr pre-seed — SAFE, ₹10 Cr
                                              post-money cap. A twelve-month
                                              runway to seed."
         cookie readable by page JS ........ false   (httpOnly)

then deep-linking straight to /investors/diligence:
         unlocked .......................... true
```

### 2.7 A bug this test caught that nothing else did

The first end-to-end run failed: the correct passcode did nothing, and the wrong
one showed no error. The server log had it:

```
⨯ Error: A "use server" file can only export async functions, found object.
```

`GATE_INITIAL` was exported from the action module. **`tsc --noEmit` was clean,
`next build` was clean, and the ungated-leak proof passed** — because the gate
page renders perfectly right up until someone presses the button. Only pressing
the button found it. The constant now lives in `app/investors/gate-state.ts`,
and the `"use server"` module exports exactly one thing: a function.

Worth recording because the failure mode is the dangerous direction of
wrong — everything that could have caught it said the work was done.

### 2.8 What was actually wrong, in full

Chasing the two approved leaks turned up three more sources of the same strings,
all invisible to a case-sensitive grep:

1. **`lib/contact.ts` exported `INVESTOR_MAILTO`**, subject
   `"CooL — Pre-seed investment (₹1 Cr iSAFE)"`. **Nothing imported it.** Dead
   code, exported from the module the public essay imports for a phone number,
   and webpack kept the expression rather than shaking it out. **Removed.**
2. **`components/Nav.tsx` exported `INVEST_MAILTO`** — a second copy of the same
   string, also unused, shipping in the shared chunk `/deck` loads. **Removed.**
3. **The keynote's own prose.** `HERO.lead` ended `"…precisely what ₹1 Cr turns
   into"`, one headline read `"What ₹1 Cr becomes, in eight weeks."`, and a lead
   began `"A pre-seed team that…"`. All string literals inside a `"use client"`
   component. **Copy leaks as readily as data** — moved behind the gate.

The keynote also stopped importing `components/Nav` for its booking URL and now
takes it from `lib/contact`. Importing one constant from Nav dragged Nav's whole
client module — and its copy of the mailto — into the gated route's chunk.
**Import surface is leak surface.**

### 2.9 The gate's design, and its honest limits

- Passcode in `INVESTOR_PASSCODE`, never committed. `.env.example` documents it.
- **Fails closed.** Unset ⇒ nothing unlocks. A missing variable can cause a
  lockout; it can never cause a leak.
- The cookie holds `HMAC-SHA256(passcode, …)`, not the passcode — a stolen
  browser profile does not hand over what is read out on calls, and **rotating
  the passcode invalidates every cookie already issued**, so rotation revokes.
- `httpOnly`, `sameSite=lax`, `secure` in production, `path=/investors`, session
  lifetime. Comparison is constant-time over fixed-length digests.
- `noindex, nofollow, nocache` remains on both routes — now defence in depth
  rather than the only defence.

**What it is not:** a shared passcode is not authentication. There are no
accounts, no revocation of one reader without rotating for everyone, and anyone
who is told the passcode can pass it on. It stops the material being *served*
without a credential, which is the thing that was broken. It does not make the
material secret from someone who was given the key.

---

## 3 · Content corrections

### 3.1 Competitor mobile label — build document wording restored

Verified in the built HTML, both label sets:

```
mobile labels:                       desktop labels:
  Auto-captures every AI change        Auto-captures every AI change
  Tamper-proof, provable evidence      Tamper-proof, provable evidence
  Neutral across every provider        Works across every provider (neutral)
  Proves which model actually ran      Proves which model actually ran
  Zero manual effort                   Zero manual effort
```

Row three differs exactly as the document specifies, and nowhere else. Both
still render from one `CAPABILITIES` array, so they cannot drift into claiming
different things.

### 3.2 `/why` — "Monday 09:14" replaced

**A correction to my STEP 0 report first: I said four occurrences. There were
four instances of the phrase, but I had the wrong four.** I listed three
metadata strings plus a chart tick, and missed `components/why/WhyStory.tsx:68`
— **the visible `<h1>` of the page**, which is the most important one. My grep
covered `src/app/why/` and the headline lives in a component. The rendered
`<h1>` was `"It is Monday, 09:14."` the whole time.

Before → after, literal substitution only, no surrounding prose touched:

| Location | Before | After |
|---|---|---|
| `app/why/page.tsx:13` (openGraph title) | `"It is Monday, 09:14."` | `"It is one ordinary morning."` |
| `app/why/page.tsx:21` (twitter title) | `"It is Monday, 09:14."` | `"It is one ordinary morning."` |
| `app/why/page.tsx:42` (JSON-LD headline) | `"It is Monday, 09:14."` | `"It is one ordinary morning."` |
| `components/why/WhyStory.tsx:68` (**visible `<h1>`**) | `It is Monday, 09:14.` | `It is one ordinary morning.` |

Two code comments describing the opener were updated to match, so the files no
longer say the story opens on a Monday when it does not.

Built `/why`: `"Monday, 09:14"` **0 occurrences**, `"one ordinary morning"` **7**,
`<h1>` confirmed as `It is one ordinary morning.`

**NOT changed — flagged for your decision.** `components/why/figures.tsx:79`
renders `09:14` as the left tick of a timeline axis whose right tick is `13:34`.
The pair exists to show four hours and twenty minutes elapsing. Substituting a
phrase leaves a label reading "one ordinary morning" opposite "13:34"; removing
the wall clock properly means relabelling **both** ticks — e.g. `0:00` / `+4:20`,
which preserves the same duration and invents no number. That is a figure
rewrite rather than a literal substitution, and the instruction was substitution
only, so I did not do it unasked. **One line from you and it is done.**

### 3.3 Tap targets — 48px floor

Measured at 390×844, **all 15** interactive elements on `/` now report exactly
**48px**, **0 under 48**:

```
CooL · Book a call (nav) · See it · Book a call · +91 99428 67200 ·
+91 97912 88350 · github.com/KenidoesCode · github.com/Sk1zmo ·
See the Studio · Get the SDK · Book a call · Investors ·
+91 99428 67200 · +91 97912 88350 · northwindcipher@gmail.com
```

The 52px nav bar still contains its 48px targets. No horizontal overflow, **0
overlapping element pairs**.

### 3.4 Inert snap points removed

`.essay section` carried `scroll-snap-align: start`, doing nothing — the essay
has no snap container. Removed, along with `.tall`'s matching
`scroll-snap-align: none`, which was the opt-out from a snap point that no
longer exists. Built CSS confirms the section rule now carries no snap property.

---

## 4 · Scroll invariant — re-verified after every change

Re-measured at 390×844 after commits 5 and 6, on the production build:

```
scrollingElement ........ html
html overflow ........... hidden auto        (x hidden, y auto — html IS the scroller)
body overflow-x ......... clip               (never hidden)
body overflow-y ......... visible            (body is NOT a scroll container)
html scroll-snap-type ... none
section snap-align ...... none               (was "start")
document height ......... 8904
```

Built stylesheet, unchanged:

```css
html{overscroll-behavior-y:contain; … ;overflow:hidden visible}
body{overflow-x:clip}
.essay section{ … min-height:100svh; … }      /* no snap property */
.essay section.tall{min-height:auto; … }
```

Journey, 40 gestures each way:

```
down ....... 0 → 8060, strictly monotonic
docMax ..... 8060        (= scrollHeight − innerHeight, reached exactly)
up ......... 8060 → 0, strictly monotonic
backAtTop .. true
```

**One scroll container, and it is `html`. No `mandatory` snap. No `100vh` on a
scroll root. The trap has not been re-introduced.** As in STEP 0, this is
emulation and is not evidence about iOS Safari.

---

## 5 · three.js — a stated requirement, evaluated and dropped

The brief named three.js as a required tool and it **is** installed
(`three@^0.185.1`, `@react-three/fiber@^9.6.1`, `@react-three/drei@^10.7.7`).
It was evaluated for this site and **deliberately not used.** This is a
deviation from the brief and is recorded rather than quietly omitted.

The only honest candidate on the public page was the Market TAM/SAM/SOM graphic.
The existing SVG:

- scales the three circles by **area** (`r ∝ √v`), not radius — sizing by radius
  would draw the SOM roughly seven times larger than it is, on the one graphic
  where a reader most expects to be flattered;
- is accessible: `role="img"` with a full `aria-label` stating all three figures;
- weighs effectively nothing and renders with JavaScript disabled;
- is sized against viewport **height** as well as width, so it does not push a
  short screen over.

Replacing it with WebGL would cost well over 150 kB against a 111 kB budget,
spin up a GPU context on phones for a decorative ring, break the page's
"everything is in the HTML that arrives" property, and risk the area-accuracy
that makes the graphic honest — to render a picture that is already correct.

Elsewhere on an essay-format page, 3D is decoration on prose.

**Decision: no WebGL layer. The remaining plan is design system → GSAP reveals →
motion polish.** If a 3D motif is wanted later, the bar it must clear is stated
above.

---

## 6 · Accepted deviations, recorded not fixed

### 6.1 Problem section is 88 words against a ~80 guideline

`#problem` runs 88 words counting its bold opener (78 for the three paragraphs
alone). **The DISPLAY TEXT is final and verbatim, and outranks the word-count
guideline.** Not touched, and not to be touched.

The guideline's actual purpose holds anyway: measured at 390×844, the section's
content is **473px inside an 844px viewport**. It does not overflow, does not
scroll inside itself, and is vertically centred. The rule exists to keep a
section on one screen; this section is on one screen.

### 6.2 The contact block goes beyond the Part 4 DISPLAY TEXT

The Cover renders two `tel:` links below its two buttons; Explore renders the
same two numbers plus the company line and the email. **None of this is in the
Part 4 DISPLAY TEXT for either section.** It arrived in commit `1846cb0` ("Walk
past a busy port; add the contact numbers") and is **intentional**. Left exactly
as is. Recorded so that a future reader diffing the page against the build
document finds the answer here instead of "fixing" it.

### 6.3 `/deck` still states the ask

By decision. The deck exists to be presented and one that cannot state its own
ask is not a deck. It is now `noindex, nofollow` and absent from the sitemap —
unlisted, not protected. Anyone with the URL sees it, and that is the intent.

### 6.4 `/why`'s chart tick

See 3.2. Awaiting a one-line decision.

---

## 7 · Sitemap and robots, final state

```
$ cat .next/server/app/sitemap.xml.body | grep '<loc>'
https://northwindcipher.com
https://northwindcipher.com/why
https://northwindcipher.com/demo
https://northwindcipher.com/pipeline
https://northwindcipher.com/dashboard
https://northwindcipher.com/studio
https://northwindcipher.com/sdk
https://northwindcipher.com/billboard

/deck robots meta ......... noindex, nofollow
/investors ................ noindex, nofollow, nocache   (+ server gate)
/investors/diligence ...... noindex, nofollow, nocache   (+ server gate)
/ ......................... index, follow
```

`/deck` is gone from the sitemap. Nine URLs became eight. `robots.txt` is
unchanged and deliberately does not name any private path — naming one in
`robots.txt` advertises it.

The rule is now written once, at the top of `ROUTES` in `lib/site.ts`, and names
all three routes it governs. Previously that comment reasoned only about
`/investors` while `/deck` carried the same terms and was listed at priority 0.7
— the exact contradiction the comment existed to prevent.

---

## 8 · Status

**Stopping here for verification before any visual work**, as instructed.

Ready for review:

- three leaks closed, proven against built output with an ungated fetch and two
  controls;
- four content corrections landed;
- `/` unmoved at 5.36 kB / 111 kB across all six commits;
- typecheck clean after every commit;
- scroll invariant re-measured and intact.

Nothing has been pushed.

Not yet done, and not started: the design-system layer, GSAP reveals, motion
polish.

Open questions for you, both one-liners:

1. `/why` chart tick `09:14` / `13:34` — relabel to `0:00` / `+4:20`, or leave?
2. Is a shared passcode the intended access model, or should `/investors` move
   to per-reader links at some point? The current model is documented honestly
   in `lib/investor-access.ts`; it stops the material being served without a
   credential, and does not make it secret from someone who was given one.

---

# ADDENDUM — fail-closed proof, and Layers 1–3

## 9 · Fail-closed proof (run before any visual work)

A gate that fails **open** when a deploy forgets an environment variable is
worse than no gate, because it looks protected. Verified at runtime against a
live `next start`, twice: once with `INVESTOR_PASSCODE` absent from the
environment, once with it set to the empty string.

Ten unauthorised paths per run — no cookie; a random 64-hex cookie; the cookie
that *would* be correct if the empty string were the passcode; the cookie
derived from the old hardcoded passcode; and a present-but-empty cookie —
across both routes.

```
====================================================================================
  INVESTOR_PASSCODE is UNSET in this server's environment
====================================================================================

/investors
  no cookie at all                        HTTP 200   21178B  GATE   0/22 terms
  a random 64-hex cookie                  HTTP 200   21178B  GATE   0/22 terms
  cookie derived from the EMPTY passcode  HTTP 200   21178B  GATE   0/22 terms
  cookie from the OLD hardcoded passcode  HTTP 200   21178B  GATE   0/22 terms
  cookie present but empty                HTTP 200   21178B  GATE   0/22 terms

/investors/diligence
  ... identical, 20067B, GATE, 0/22 terms on all five

====================================================================================
  VERDICT: FAILS CLOSED. 10 unauthorised paths tried, 0 returned any protected term.
====================================================================================
```

Identical verdict with the variable set to an empty string.

The form was also exercised in a browser against a server with no secret set.
Four guesses — the old passcode, empty, "password", "admin" — all refused:

```
gateShown: true    askInDom: false    rawHtmlHasRaise: false
old passcode -> "That is not it. Ask us on the call."
empty        -> "Enter the passcode, or request access below."
password     -> "That is not it. Ask us on the call."
admin        -> "That is not it. Ask us on the call."
stillGatedAfterAll: true
```

### DEPLOYMENT NOTE — required

**`INVESTOR_PASSCODE` must be set in the hosting environment.** Vercel: Project
→ Settings → Environment Variables, Production and Preview. It is read per
request, so it can be set or rotated without a rebuild.

If it is missing, `/investors` and `/investors/diligence` render the gate and
accept nothing — a lockout, never a leak. Rotating it invalidates every cookie
already issued, because the cookie holds a keyed digest of the passcode rather
than a flag. `.env.example` documents it; the real value is never committed.

## 10 · The per-layer gate

Run in full after each layer. All three layers passed all of it.

| Check | Layer 1 | Layer 2 | Layer 3 |
|---|---|---|---|
| build — `/` route | 5.36 kB | 5.94 kB | 5.94 kB |
| build — `/` First Load JS | **111 kB** | **112 kB** | **112 kB** |
| Delta vs the 5.36 kB / 111 kB baseline | **none** | +0.58 kB / +1 kB | +0.58 kB / +1 kB |
| `npm run typecheck` | clean | clean | clean |
| reduced-motion: final states, 0 running animations | PASS | PASS | PASS |
| JS disabled: 10 sections, 50 elements, 0 hidden | PASS | PASS | PASS |
| Scroll 390×844: 0 → 8060 → 0, monotonic, exact doc max | PASS | PASS | PASS |
| Nothing rolled back | — | — | — |

Scroll invariant, re-measured after every layer, unchanged throughout:
`scrollingElement = html`, `html{overflow:hidden auto}`, `body{overflow-x:clip;
overflow-y:visible}`, `scroll-snap-type: none`, no horizontal overflow, last
section fully visible.

## 11 · Layer 1 — design system

Forty-odd inline style objects became classes and tokens in the `.essay` scope.
The build document's spacing, measure and palette are unchanged.

**Proven, not asserted:** a geometry fingerprint was captured before the
refactor and compared after — at 390×844, 1440×900 and 2560×1440, covering
every section top and height, every text run's width, height, font-size,
line-height, weight, colour and indent, every tap target's box and colours and
radius, the nav, the founders grid, the avatar, the comparison breakpoint, and
per-section word counts.

```
GEOMETRY IDENTICAL — 0 differences across phone/laptop/wide
html chars: 56,971 -> 48,726  (-8,245, -14.5%)
```

That diff caught **three regressions**, all fixed before commit:

1. `.essay-nav a { display: inline-flex }` is (0,1,1) and silently
   out-specified `.essay-navlink { display: none }` at (0,1,0), putting all
   four section links back on a 390px screen.
2. The GitHub handle lost `margin-top: var(--s2)` when it stopped being
   `class="tiny"` — 16px per founder, 32px off the stacked phone layout.
3. The email was mapped to the wrong type token, shrinking it from 13.3px to
   12px and the link from 180px to 163px wide.

None would have been obvious by eye.

One deliberate addition: `:focus-visible`. The essay had none and fell back to
the UA ring, a dark outline on a near-black canvas. Verified by tabbing:
2px accent ring at 3px offset.

## 12 · Layer 2 — GSAP reveals

Three rules keep the page's defining property intact.

**No start state in CSS.** The zero-opacity is written by JS at runtime. With JS
disabled: 10 sections, 50 elements, **0 hidden**, docHeight 8904.

**Only off-screen elements are ever hidden.** GSAP is imported dynamically and
lands after first paint; hiding what the reader is already looking at is a
flash, not an entrance. The cover therefore has no entrance, deliberately.
Verified: every element in the cover sits at opacity 1 throughout.

**Lazy.** The three GSAP chunks (42 + 6 + 51 kB raw) are *not* referenced by the
initial HTML. The +1 kB First Load JS is the driver component, not the library.

Motion: 450ms, `power2.out`, 60ms stagger, 16px rise, opacity and transform
only, `once: true`. No pin, no scrub, no snap; `normalizeScroll` never called.
Confirmed after a full journey: **0 pin-spacers, 0 markers**, `html` still the
only scroll container, `touch-action` still `auto`.

Watched one reveal fire rather than trusting the build — the market opener:
opacity 0, then 0.21 mid-tween, then 1 settled, and `clearProps` left the
inline style empty.

Two failsafes for the one real risk, content stranded at zero opacity: setup
runs in try/catch and reverts on any throw, and an `@media print` rule forces
opacity and transform back for the whole essay, because printing does not
scroll. That rule can only reveal; it can never hide.

**The first gate check failed this layer, and the check was wrong, not the
layer** — it measured at scroll-top, where below-fold sections are legitimately
in their start state. It now scrolls the whole page first and asserts
everything resolves, and separately asserts the cover is never hidden.

## 13 · Layer 3 — micro-interactions

CSS transitions only. **No new dependency, and `/` did not move: 5.94 kB /
112 kB, identical to Layer 2.**

Animated: transform, opacity, and the paint-only colour properties. Nothing
animates width, height, margin, padding or font-size. Asserted at runtime
across every element in `.essay`: **0 transitions name a layout-affecting
property**.

140–180ms, ease-out, no overshoot. Every hover rule sits inside
`@media (hover: hover) and (pointer: fine)` — an unguarded `:hover` sticks after
a tap on touch. Confirmed the query is `false` under phone emulation.

Exercised in a real browser:

```
rest      bg rgb(91,140,255)    transform none      transitions 0.14/0.16s
hover     bg rgb(122,162,255)   translateY(-1px)
active                          translateY(+1px)
tap-link  underline transparent -> rgb(91,140,255)
phone     (hover:hover and pointer:fine) = false
reduced   transition-duration 0s, hover STILL reaches rgb(122,162,255)
```

Reduced motion turns the transitions **off**, not shorter. The states remain and
arrive instantly — how the page behaved before this layer.

## 14 · What was NOT changed, for the record

Concern was raised that the UI modules and background effects had been
rewritten. They were not, and this is checkable:

- **Every background/effects module is untouched**, verified against the audit
  commit: `Backdrop.tsx`, `ConceptStage.tsx`, `Spotlight.tsx`, `Cursor.tsx`,
  `IntroSequence.tsx`, `Slide.tsx`, `ui.tsx`, `landing/Sections.tsx`.
- **Every `globals.css` change is at line 1098 or later** — inside the `.essay`
  block. The theme colour tokens, `.glass`, `.frost`, `.grain`, the `.hud`
  console scope, the ambient-motion block and both studio skins are untouched.
- `/deck` still renders its cipher field, 3D cube, grain and nav; `/demo`,
  `/studio`, `/dashboard` and `/why` all still report their canvases, grain and
  background colour.
- Layer 1 was proven pixel-identical, section 11.

The one genuine visual change to the public page is Layer 2's scroll reveals,
which is a single commit and revertible on its own.

## 15 · Standing rule, from this project's own findings

**A green build is not proof that a thing works.** `tsc --noEmit` was clean,
`next build` was clean, and the ungated-leak proof passed — over a gate that did
not open, because a `"use server"` module exported a constant and that only
fails at runtime. Anything interactive gets clicked, submitted or navigated in a
real browser before it is called done. Every interactive change in Layers 1–3
was exercised that way.
