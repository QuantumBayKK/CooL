# CooL — site, live demo and console

The pitch deck, the working product surfaces, and a live evidence pipeline that
runs the real CooL cryptography in the visitor's browser.

Production: **https://northwindcipher.com**

```bash
npm install
npm run dev          # http://localhost:3002
npm run build        # production build
npm run verify:sdk   # prove the vendored SDK matches the published spec
```

---

## Routes

| Route | What it is |
|---|---|
| `/` | The 13-slide investor deck |
| `/demo` | Five-view live demo — pipeline, timeline, integrations, intelligence, internals |
| `/dashboard` | The SaaS console: estate, change feed, predictive risk, compliance, audit export |
| `/investors` | Keynote-style technical & operational diligence, 14 stages |
| `/billboard` | Terminal billboard — live-types the verify command and streams real output |

---

## The one thing that matters

**The cryptography is real and runs on the visitor's machine.** It is not a
re-enactment, an animation, or a recording.

`src/lib/cool/` is the [`cool-sdk`](https://github.com/KenidoesCode/cool-sdk)
source, vendored. Exactly one file differs from upstream:
[`codec.ts`](src/lib/cool/codec.ts), whose hex/base64 helpers were rewritten off
Node's `Buffer` onto `btoa`/`atob` so they run in a browser.

That deviation is proven byte-transparent rather than asserted.
`npm run verify:sdk` ([`scripts/verify-sdk.ts`](scripts/verify-sdk.ts)):

1. mints a receipt, verifies it, tampers with it, confirms it is rejected on
   both the binding and signature domains;
2. verifies the **published `cool-spec` conformance vectors** — produced by the
   upstream Node implementation — under this browser-safe code;
3. confirms every tampered vector is rejected.

22 checks, all passing. If the codec deviation ever broke equivalence, step 2
fails immediately.

### Honesty rules that are enforced in code

- Hardware attestation reports **`MOCK`**, never `pass`.
- Public anchoring reports **`ABSENT`**, never `pass`.
- A CooL self-signature is shown but **never counted** as an independent witness.

These are in the verifier itself, not in the copy. You cannot make them go green
from the UI. Anything on the site that is a stand-in — transport hops, outbound
Jira/Slack calls, the demo estate data — is labelled `SIMULATED` or stated as
synthetic on screen.

---

## Fixes and features, and how each one works

### 1 · Mobile scrolling — rubber-banding, dead slides, broken scroll

Four separate bugs, three of them introduced when the slides became
content-rich.

**Mandatory snap on a phone.** `html` carried `scroll-snap-type: y mandatory`
globally. Once slides grew taller than a ~390px viewport, every attempt to read
the bottom of a slide was yanked back to its top — the rubber-banding.
Fix: [`globals.css`](src/app/globals.css) disables snapping on coarse pointers.

```css
@media (hover: none), (pointer: coarse) {
  html { scroll-snap-type: none; }
  [data-slide], [data-slide].is-tall {
    scroll-snap-align: none;
    scroll-snap-stop: normal;
  }
}
```

**Re-measuring mid-gesture.** [`SnapScroll.tsx`](src/components/SnapScroll.tsx)
measured every slide on every `resize` and toggled `.is-tall`. On mobile the URL
bar collapsing *is* a resize, so snap points were being added and removed
underneath a scroll already in flight. Fix: re-measure only when the **width**
changes (height-only churn is browser chrome), and skip measuring entirely on
touch since the stylesheet has already disabled snapping.

**Slides genuinely rendering at 50% opacity.** `SlideFrame` in
[`Slide.tsx`](src/components/Slide.tsx) scrubs opacity `0.5 → 1 → 0.5` across
scroll progress, mapped from "slide top enters" to "slide bottom leaves". On a
slide taller than the screen you spend most of your reading time near the ends
of that range, so real content sat dimmed. Fix: the fade and scale are now
desktop-only; mobile keeps the entrance animation and nothing scroll-linked.

**Stale slide count.** [`DeckControls.tsx`](src/components/DeckControls.tsx)
hard-coded `TOTAL = 12`. Adding a 13th slide silently disabled the ↓ chevron one
slide early. Fix: the count is read from the DOM, so it cannot drift again.

Also added `overscroll-behavior-y: none` on `html`, which kills the elastic
bounce at the document ends and stops a downward flick on the last slide from
triggering pull-to-refresh.

### 2 · Intro sequence — ~7.3s → ~2.5s, no skip button

[`IntroScene.tsx`](src/three/IntroScene.tsx) beats were retimed (arrive 0.3s,
open 0.5–1.0s, seal 1.4s) and `INTRO_DARK_MS` cut from 950ms to 240ms.

The seam between "cube flies to its slot" and "black lifts" is gone because
[`IntroSequence.tsx`](src/components/IntroSequence.tsx) now **overlaps** them:
the reveal starts at 45% of the flight and the intro canvas cross-fades into the
hero's own canvas at 72%, so the site is already behind the cube when it lands.

The skip button is removed. Any wheel, touch or key still cuts straight through
— the escape hatch is invisible rather than absent. The failsafe timeout dropped
from 12s to 3.6s.

### 3 · Live demo — five views

[`DemoShell.tsx`](src/components/demo/DemoShell.tsx). Only the pipeline loads
eagerly; the other four are code-split, so the route costs one view rather than
five (15.8 kB, 232 kB first load).

**Pipeline** — [`pipeline.ts`](src/lib/demo/pipeline.ts) runs eight stages, each
declaring `REAL` or `SIMULATED`. Everything cryptographic is real: deterministic
CBOR, SHA-256 binding, ML-DSA-65 + Ed25519 hybrid signing, an RFC 6962 log, and
offline verification. [`merkle-walk.ts`](src/lib/demo/merkle-walk.ts) replays the
audit path step by step using the same `nodeHash` the verifier calls, so the
animated climb *is* the verification, not a picture of it. Four attack buttons
then forge the receipt and the same verifier rejects it, naming the domain.

**Timeline** — [`timeline.ts`](src/lib/demo/timeline.ts) traces one AI change
across commit → PR → CI → capture → policy → approvals → Jira → Confluence →
Slack → evidence sealed → audit register, plus incident and remediation on the
chain that has one. Every node expands to the payload that integration actually
wrote. Human vs `AUTO` is marked per node, with the minutes each would have cost.

**Integrations** — [`integrations.ts`](src/lib/demo/integrations.ts) lists twelve
connectors with truthful `CONNECTED` / `AVAILABLE` / `PLANNED` status, the auth
each uses, what CooL reads, and — the part that carries the value — exactly what
it writes back.

**Intelligence** — prediction and memory. Prediction is the risk model reading
changes before they bite; memory is the indexed history, where every error
carries the change it traces back to, which is what makes "why did this break" a
lookup instead of a war room.

**Internals** — [`InternalsView.tsx`](src/components/demo/InternalsView.tsx)
dissects a receipt minted seconds earlier: the canonical CBOR hex, the signing
message `canonicalCBOR(core) ‖ binding_digest`, the RFC 6962 leaf
`SHA256(0x00 ‖ digest)`, and the real measured key and signature sizes. Press
regenerate and every value changes, because it is computed rather than recited.

### 4 · Dashboard — predictive risk that can be interrogated

[`risk.ts`](src/lib/dashboard/risk.ts) is a logistic model over eight normalised
features with fixed published weights. It returns the probability **and** the
per-feature contribution breakdown, so every score decomposes into the signals
that caused it, and each recommended fix is keyed to the actual top driver
rather than being generic advice.

The weights are priors set from the failure modes the architecture is designed
around. They are **not** fitted on customer data — there is none yet — and the
UI says so. In deployment they are re-fit per tenant.

[`estate.ts`](src/lib/dashboard/estate.ts) generates the demo estate from a
seeded PRNG against a fixed clock (`ESTATE_NOW`). No `Math.random()`, no
wall-clock reads: server and client render identically, so there is no hydration
mismatch and the demo never reshuffles under the reader.

### 5 · Market sizing — area-proportional

[`MarketCircles.tsx`](src/components/MarketCircles.tsx) scales each ring by
**area**, not radius (`r ∝ √value`). Sizing by radius would draw the SOM roughly
7× larger than it is. Each ring carries its own why, how and source.

### 6 · Investors — Apple-keynote staging

[`KeynoteStage.tsx`](src/components/investors/KeynoteStage.tsx) gives 14
full-screen stages, one idea each, with sequential `Build` beats staggered at
110ms. The `100svh` constraint is the discipline: anything that does not fit is
a stage trying to say two things, and gets split. That is also why these fit a
phone — the content is sparse by construction.

### 7 · Lighting

[`Stage.tsx`](src/three/Stage.tsx) — there is no ray tracing in a browser at this
budget. What sells "rendered" is image-based lighting: the lightformers *are* the
reflections. Added a small bright specular catch (a big softbox alone makes metal
read as matte plastic, because nothing in the environment is small enough to
reflect as a distinct highlight) plus a second dimmer streak so a turning object
catches light continuously. `envMapIntensity` was raised above 1 in
[`materials.ts`](src/three/materials.ts), which is the single biggest lever on
how rendered it looks. Environment and shadow-map resolution are chosen per
device so phones stay fast.

### 8 · SEO

`metadataBase` plus a `%s — CooL` title template, per-route canonicals and
OG/Twitter cards, a build-time 1200×630 OG image
([`opengraph-image.tsx`](src/app/opengraph-image.tsx), verified as a 130 KB PNG),
[`sitemap.ts`](src/app/sitemap.ts), [`robots.ts`](src/app/robots.ts), and JSON-LD
linking Organization → WebSite → SoftwareApplication.

`sitemap.lastModified` is pinned to the build rather than evaluated per request:
these are static pages, and claiming they changed on every crawl trains search
engines to distrust the field.

---

## Deploying

```bash
npx vercel deploy          # preview (SSO-gated)
npx vercel deploy --prod   # northwindcipher.com
```

[`.vercelignore`](.vercelignore) keeps the upload lean. Its root-anchored
patterns (`/*.jpg`, not `*.jpg`) matter: a bare glob would also swallow
`public/founders/*.jpg`, which are real runtime assets on the team slide.

---

## Repository notes

`3d models/` (59 MB of raw source GLBs, one of them 37 MB) is **git-ignored**.
The optimised models that actually ship are committed under `public/models/`
(under 1 MB each), produced by `npm run models`. If those raw sources should be
versioned, Git LFS is the right mechanism — committing them directly would
permanently slow every clone.

---

## Credits

Built by Northwind Cipher Pvt. Ltd.
SDK, verifier and spec: [`cool-sdk`](https://github.com/KenidoesCode/cool-sdk) ·
[`cool-verifier`](https://github.com/KenidoesCode/cool-verifier) ·
[`cool-spec`](https://github.com/KenidoesCode/cool-spec) — Apache-2.0.
