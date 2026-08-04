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
| `/studio` | **The product itself** — the confidential-compute SDK, an Atlassian-shaped console over the evidence it produces, and a VS-Code-shaped IDE over the code that produces it |

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

## Studio — the SDK, the console and the IDE (`/studio`)

`/studio` is the confidential-compute tier of CooL: the SDK that runs inside a
Phala dstack TEE, a console over the evidence it produces, and an IDE over the
integration that produces it. All three share **one live SDK session**, booted in
the visitor's browser. Nothing on the page is fetched, mocked or pre-rendered —
every record is signed in the tab, and every verdict is recomputed by the same
verifier an auditor would run.

### What the SDK adds over v1

v1 (`src/lib/cool`) is frozen: its runtime block is hard-coded to `mock`, because
the shipped v1 SDK has no hardware anywhere in its path. v2 (`src/lib/cool/phala`)
is additive, and it makes three new things checkable:

| Claim | Mechanism |
|---|---|
| **Where** the record was produced | MRTD + RTMRs are inside the signed core, so the measurement cannot be swapped after the fact |
| **Who** signed it | the quote's `report_data` commits to the very public key the record is signed with — "attested code" and "signing key" become one chain |
| **Which model** ran | weights commitment plus an optional NVIDIA CC attestation reference for the serving stack |

| Module | Responsibility |
|---|---|
| `phala/dstack.ts` | the three guest-agent calls — TCB info, quotes, measurement-bound key derivation. `HttpDstackClient` for a real CVM, `SimulatedDstackClient` for a laptop or CI |
| `phala/kms.ts` | derives the ML-DSA-65 + Ed25519 signing keys **from the measurement**. Different image → different key |
| `phala/ratls.ts` | attest-before-send. Fail-**open** toward your application, fail-**closed** toward the network |
| `phala/capture.ts` | the async, bounded, non-throwing queue. `capture()` is an array push; loss is counted, never silent |
| `phala/engine.ts` | the evidence plane: commit → bind → hybrid-sign → append to an RFC 6962 log. Runs inside the enclave |
| `phala/verify.ts` | seven domains, offline. `pass` only where a hardware root was actually checked; `simulated` never rounds up |
| `phala/gpu.ts` | Phala's private-LLM client, and the reduction of a provider attestation report to a commitment |

Conformance — the properties are proved by attacking them:

```bash
npm run verify:tee
```

It seals a record in a simulated enclave, edits one byte (binding **and**
signature fail), staples a valid quote from a different image (the enclave domain
catches it, because the quote digest is inside the signature), redeploys from a
patched image (a different key is derived, and the old pin now fails), and points
a client at a mismatched measurement (the channel never opens, nothing is
transmitted, and the application still gets its completion).

### Using the SDK

```ts
import { CoolTee } from "cool-nwc";

const cool = await CoolTee.connect({
  app: { name: "refund-agent", imageDigest: process.env.IMAGE_DIGEST! },
  backend: async ({ model, prompt, params }) => ({ output: await yourModel(model, prompt, params) }),
});

const { output } = await cool.complete({ model: "phala/deepseek-v4-pro@2026.07", prompt });

await cool.change({
  kind: "prompt",
  ref: "billing/refund-agent#system",
  before: previousPrompt,
  after: nextPrompt,
  actor: { id: "ci:github-actions", method: "oidc" },
});
```

In production, swap the simulator for the guest agent and pin the image — that
object is the whole difference between a demo and a deployment:

```ts
const cool = await CoolTee.connect({
  dstack: new HttpDstackClient({ endpoint: "/var/run/dstack.sock", vendor: "intel-tdx" }),
  expectedMeasurement: PINNED_MEASUREMENT,
  policy: {
    expectedMeasurement: PINNED_MEASUREMENT,
    allowSimulated: false,
    requireVendor: ["intel-tdx"],
    verifier: remoteQuoteVerifier({ endpoint: process.env.QUOTE_VERIFIER_URL!, root: "intel-dcap" }),
  },
});
```

There is no signing key to configure. There cannot be one — it is derived inside
the enclave from the measurement, which is exactly why CooL cannot forge a
customer's records.

### The `cool` command

`npm install -g cool-nwc` and `cool` works in any directory. It is the SDK with a
prompt in front of it — same evidence plane, same verifier, receipts in
`.cool/receipts/` and one log per project in `.cool/log/`.

```sh
cool                 # interactive session
cool walkthrough     # the whole model, by doing it, in ~3 minutes
cool help            # 13 command pages + 10 concept pages
```

| Group | Commands |
|---|---|
| evidence | `seal` `verify` `records` `disclose` `log` `witness` |
| governance | `policy` `compliance` `pack` |
| runtime | `status` `attest` `stats` `doctor` |

Zero dependencies beyond the ones a signature already needs: the panels,
spinners, bars and sparklines are [`cli/tty.ts`](src/lib/cool/cli/tty.ts), which
falls back to ASCII on a legacy Windows console and to plain lines when piped.
[`tests/cli.test.ts`](tests/cli.test.ts) drives the real binary in temp
directories, including the exit codes CI depends on.

### What 2.4.0 added — a real anchor

The `anchor` domain used to report `absent` with the word "planned" next to it.
It now commits tree heads to Bitcoin, and it is the only domain in the receipt
that is not a signature.

That distinction is the point. Every other proof says "someone holding this key
asserts X" — which whoever holds the key can produce at any time, including
later, about a past they would prefer. That is precisely the attack a
transparency log exists to rule out, and no amount of signing fixes it. A block
header cannot be backdated.

[`anchor.ts`](src/lib/cool/phala/anchor.ts) is an OpenTimestamps client — the
format, not a lookalike. The proofs it writes are byte-identical to the reference
implementation's (checked against it, not assumed), so `cool anchor export` hands
an auditor a `.ots` file they can verify with the standard tool and a Bitcoin
node without running any CooL code. Four independently operated public calendars,
no gas, no wallet, no key.

The states are honest: `submitted` while the calendars hold it, `pending` once it
commits to a block nobody has checked here, `pass` only when the commitment has
been recomputed and matched against a real block header. Aggregation is hourly,
so `pending` is where a fresh anchor legitimately sits for an hour — calling that
a pass would be the same lie as calling a simulated quote hardware.

### What 2.3.0 added — the on-prem path

2.2.0 could talk to a dstack agent over HTTP. Real deployments do not use HTTP:
the guest agent listens on `/var/run/dstack.sock`, and `fetch` cannot open a
unix socket. So the documented configuration would have failed at the first
call.

- **A socket transport.** [`unix.ts`](src/lib/cool/phala/unix.ts) gives
  `HttpDstackClient` a `fetch`-shaped function backed by `node:http` — unix
  sockets on Linux, named pipes on Windows, with ENOENT and EACCES translated
  into the two things they actually mean ("you are not inside a CVM" and "the
  socket is not mounted"). [`tests/socket.test.ts`](tests/socket.test.ts) stands
  up a guest agent on a real socket and drives a full seal-and-verify through it.
- **`cool wire`.** The five steps between `simulated` and `pass`, checked in
  order, stopping at the first unmet one with the command that fixes it — then
  sealing a probe record and verifying it under `--require-hardware`, so a green
  run means the path works rather than that the configuration looks right.
- **`cool update`.** One command instead of uninstall-then-reinstall, with the
  Windows shim collision and the permission failure each given their own remedy,
  and `npm ls -g` afterwards to prove the version actually moved.
- **A deployment bundle.** [`deploy/`](deploy/) — Dockerfile, compose file with
  the socket mounted, dstack app manifest with KMS key provisioning, and
  [`deploy/README.md`](deploy/README.md), the runbook from `phala deploy` to a
  verified receipt, including the three ways a *real* quote still must fail.

Command reference: [`docs/COMMANDS.md`](docs/COMMANDS.md).

### What 2.2.0 added

Each of these closes a gap that was visible in the product before it:

- **A persistent log.** Every CLI run used to start a fresh tree, so a hundred
  records were a hundred trees of size one — which proves nothing about ordering
  or completeness. [`log-file.ts`](src/lib/cool/phala/log-file.ts) keeps one tree
  per project and refuses to start on a corrupt leaf file rather than silently
  reindexing.
- **Policy inside the enclave.** An approval used to be an argument the caller
  asserted. Now [`policy.ts`](src/lib/cool/phala/policy.ts) evaluates declarative
  rules where the record is sealed, and the decision — plus the rule id and a
  hash of the whole rule set — is covered by the same signature. Strictest rule
  wins, so a permissive rule added later cannot quietly override a stricter one.
- **Selective disclosure.** Salts were always stored;
  [`disclose.ts`](src/lib/cool/phala/disclose.ts) makes them useful: open one
  field, prove it matches the commitment, leave the rest closed.
- **Witnesses that count.** The witnesses domain reported `absent` by
  construction. [`witness.ts`](src/lib/cool/phala/witness.ts) lets an independent
  party co-sign the tree heads they saw, so it can now honestly `pass` — while a
  CooL self-signature still never counts.
- **Compliance and audit packs.** [`compliance.ts`](src/lib/cool/phala/compliance.ts)
  maps clauses onto the receipt fields that satisfy them and counts the records
  behind each; [`pack.ts`](src/lib/cool/phala/pack.ts) builds and verifies the
  single file an auditor asks for, re-deriving the summary rather than trusting
  it.
- **Search.** [`query.ts`](src/lib/cool/phala/query.ts) — evidence nobody can
  search is evidence nobody uses.
- **A manual.** [`docs.ts`](src/lib/cool/cli/docs.ts) holds 13 command pages and
  10 concept pages as data, so `cool help attestation` explains the idea rather
  than listing flags.

### Using the console

Slack's arrangement, Atlassian's palette, 3px corners. Eight views:

| View | What to do there |
|---|---|
| **Overview** | the numbers a platform team challenges first: capture p99, events dropped, verify rate, log size |
| **Evidence ledger** | filter, open a record, read its diff or its commitments, then **Tamper** or **Swap quote** and watch the verdict change |
| **Governance** | policies, decisions and obligations; **Export audit pack** downloads the real artefact — receipts, key directory, pinned measurement, clause mapping |
| **Attestation** | measurement registers, the RTMR3 event log, the RA-TLS transcript, the key-sealing chain, and a **redeploy** control that rotates the key on purpose |
| **Models & GPU** | Phala's private-LLM catalogue and GPU shapes; run one and inspect the model identity and GPU attestation the record carries |
| **Verifier** | paste any receipt — including one you edited in a text editor — and run the verifier over it |
| **Studio IDE** | the workspace, in an editor |
| **Install the SDK** | the copy-paste path |

### Using the IDE

The explorer holds the files an integration actually adds: the CooL bootstrap,
the app, the pinned measurement, the dstack manifest, the compose file, the
Dockerfile, the CI hook, the Rego policy, and the verifier an auditor runs. The
terminal is wired to the live session, not to a transcript:

| Command | What it really does |
|---|---|
| `npm run dev` | replays the boot: TCB, key derivation, and each RA-TLS check |
| `phala deploy` | the deploy narrative, with this session's measurement |
| `phala cvms attestation` | prints the quote body the records are bound to |
| `cool seal` | signs a change record inside the enclave, now |
| `cool verify latest` | runs the verifier and prints all seven domains |
| `cool stats` | the capture queue's measured counters |

### Publishing the SDK

`/sdk` is the developer entry point, and the artefacts it serves are built from
`src/lib/cool` itself — not from a copy — so the library a stranger downloads and
the library that produced the receipts on `/studio` cannot drift:

```bash
npm run sdk:build     # → public/sdk/
```

| Artefact | What it is |
|---|---|
| `cool-nwc-<version>.tgz` | an npm tarball. `npm install https://northwindcipher.com/sdk/cool-nwc-2.1.0.tgz` works without a registry account |
| `cool-nwc.js` | single-file ESM bundle of the confidential-compute tier — importable straight into a browser or Deno |
| `checksums.txt` / `manifest.json` | sha256 of both; the `/sdk` page reads the manifest at build time, so its table can never disagree with what is being served |

The package source lives in [`packages/cool-nwc/`](packages/cool-nwc/) (manifest,
licence, README); the build compiles `src/lib/cool` into it and patches the
emitted specifiers so Node's ESM resolver can follow them. `/sdk` ends with a
panel that imports the published bundle from its published URL and seals a record
in the reader's browser — if the artefact were broken, the page would say so.

Published as **[`cool-nwc`](https://www.npmjs.com/package/cool-nwc)**, with
**`cool-tee`** as a thin alias that re-exports it. Releasing is
`npm run release -- --alias`: it verifies everything first, skips whatever is
already on the registry, and turns npm's two-factor 403 into instructions
instead of a stack trace. npm requires 2FA to publish — an authenticator app, or
a granular access token with *Bypass 2FA* for CI.

### Checks

| Command | What it proves |
|---|---|
| `npm test` | 33 unit tests: the dstack HTTP client against a mock guest agent (every encoding, renamed RPCs, POST-only `Info`), the quote verifier's failure modes, Phala's inference client, the capture queue's promises, and the evidence itself |
| `npm run verify:tee` | the confidential tier, attacked — tamper, quote-swap, key rotation, refused channel |
| `npm run verify:sdk` | the v1 core against the published `cool-spec` vectors |
| `npm run verify:package` | packs, installs into a clean project, runs it, and typechecks a consumer under both `nodenext` and `bundler` resolution |
| `npm run verify:live` | points the SDK at a **real** dstack agent, attestation service and inference endpoint; skips loudly when unconfigured |

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs all of it plus lint,
typecheck and both builds on every push. The `live` job is manual and carries the
secrets for a real CVM — it is the one that will print `attestation: pass` on
real silicon.

### Honesty, enforced

The enclave on this page is **simulated**: quotes are structurally complete and
cryptographically real, and they chain to a CooL-held root rather than to Intel.
The verifier reports `simulated` — never `pass` — on the two domains that depend
on hardware, every receipt says so in its own attestation block, and ticking
*require hardware root* in the Verifier makes the same receipt unacceptable.
Turning that into `pass` is the eight-week integration, not a copy change.

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
