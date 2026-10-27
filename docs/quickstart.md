# Quickstart

*Install the SDK, wire capture into an existing application, and seal your first record.*

Five minutes from nothing to a record you can verify offline. By the end of
this page you'll have sealed one real record and checked it yourself.

**Before you start:** Node 20 or later, and an existing app that calls a
model — CooL wraps a call you already make, it doesn't add a new one.

## Step 1 · Install

```bash
npm install cool-nwc
```

The CLI is the same package, installed globally:

```bash
npm install -g cool-nwc
cool --help
```

## Step 2 · Connect

`CoolTee.connect` boots an evidence plane — the thing that will hash, sign and
log whatever you ask it to seal. On a laptop or in CI it runs against a
built-in simulator; nothing here needs real hardware yet.

```ts
import { CoolTee } from "cool-nwc";

const cool = await CoolTee.connect({
  app: { name: "refund-agent", imageDigest: process.env.IMAGE_DIGEST! },
  backend: async ({ model, prompt, params }) => ({
    output: await yourModel(model, prompt, params),
  }),
});
```

> [!NOTE]
> The `backend` function is your existing inference call, unchanged. CooL wraps it
> rather than replacing it, and it is never in the critical path — if the evidence
> plane is unavailable your completion still returns.

## Step 3 · Seal a change

A "change" is anything that alters how your AI system behaves — here, a
prompt edit. This is the call that actually produces a record:

```ts
await cool.change({
  kind: "prompt",
  ref: "billing/refund-agent#system",
  before: previousPrompt,
  after: nextPrompt,
  actor: { id: "ci:github-actions", method: "oidc" },
});
```

That one call commits the change, binds a SHA-256 digest, signs with ML-DSA-65
and Ed25519, and appends an entry to the transparency log. It returns once the
record is sealed — nothing happens asynchronously that you have to wait on
separately.

## Step 4 · Verify it

This is the part that matters: check what you just sealed, the same way a
stranger would — no account, no network call.

```bash
cool verify .cool/receipts/latest.json
```

You should see all seven domains print `pass` (or `simulated` for
`attestation`, since you're not on real hardware yet — that's expected, not
an error). See the [verifier reference](verifier-reference.md) for what
each line means.

## Step 5 · Going to production

Two things change, and nothing else:

```ts
const cool = await CoolTee.connect({
  dstack: new HttpDstackClient({
    endpoint: "/var/run/dstack.sock",
    vendor: "intel-tdx",
  }),
  expectedMeasurement: PINNED_MEASUREMENT,
  policy: {
    expectedMeasurement: PINNED_MEASUREMENT,
    allowSimulated: false,
    requireVendor: ["intel-tdx"],
  },
});
```

There is no signing key to configure, and there cannot be one — it is derived
inside the enclave from the measurement. That is exactly why CooL cannot forge
your records.

## What you just did

You installed the SDK, sealed a real record of a change, and verified it with
the same code a third party would use — without trusting a dashboard, an
account, or a network call to tell you it passed.

## Next

- [Architecture](architecture.md) — where each part actually runs, and the one trust boundary that matters
- [CLI reference](cli-reference.md) — every `cool` command, flags and examples
- [Threat model](threat-model.md) — who you still have to trust
