# cool-nwc

**Tamper-evident, offline-verifiable evidence for AI systems — sealed inside a
hardware TEE.**

Every AI change (a prompt edit, a model bump, a widened agent permission) and
every inference is committed, hybrid-signed and appended to an RFC 6962
transparency log. When the evidence plane runs inside a confidential VM, the
signing key is derived from the enclave's measurement, so the record proves
*where* it was produced and *which key* the hardware attested — and the vendor
of the SDK cannot forge one.

- **Hybrid post-quantum signatures** — ML-DSA-65 (FIPS 204) **and** Ed25519.
  Both must verify.
- **Salted commitments** — prompts and outputs are hashed, never stored. No
  plaintext leaves the customer's environment.
- **RFC 6962 transparency log** — inclusion proofs under a signed tree head.
- **Measurement-sealed keys** — via Phala dstack-KMS on Intel TDX / AMD SEV-SNP.
- **RA-TLS capture** — the SDK verifies the enclave's quote *before* it
  transmits anything. Fail-**open** toward your application, fail-**closed**
  toward the network.
- **Offline verifier** — seven domains, no network, no accounts, no trust in us.

## Install

```sh
# the library
npm install https://northwindcipher.com/sdk/cool-nwc-2.0.2.tgz

# …and the `cool` command, in any directory
npm install -g https://northwindcipher.com/sdk/cool-nwc-2.0.2.tgz
```

Browser or Deno, no bundler:

```js
import { CoolTee } from "https://northwindcipher.com/sdk/cool-nwc.js";
```

Checksums for both artefacts: <https://northwindcipher.com/sdk/checksums.txt>

## The `cool` command

A global install puts `cool` on your PATH. Run it anywhere:

```sh
cool                 # interactive session — banner, prompt, live panels
cool walkthrough     # learn the whole model by doing it, in ~3 minutes
cool help            # the manual: 13 command pages, 10 concept pages
cool help attestation   # …including the concepts, not just the flags

# evidence
cool seal prompt billing/agent#system "Approve refunds up to $500."
cool records --kind prompt --env prod      # search what you have
cool verify all                            # exits non-zero on any failure
cool disclose last change.after "…"        # open ONE field, provably
cool log --consistency 12                  # prove the tree only grew
cool witness cosign --key auditor          # independent co-signature

# governance
cool policy                                # the rules, with the reasoning
cool policy test agent-permission app#tools --env prod
cool compliance                            # obligations vs. actual evidence
cool pack build --out audit.json           # the artefact an auditor asks for
cool pack verify audit.json

# runtime
cool status · cool attest · cool stats · cool doctor
```

Receipts land in `.cool/receipts/` — one JSON file per record, greppable and
attachable to a ticket. `cool verify <file>` needs no enclave at all, which is
the situation an auditor is in.

## Use

```ts
import { CoolTee } from "cool-nwc";

const cool = await CoolTee.connect({
  app: { name: "refund-agent", imageDigest: process.env.IMAGE_DIGEST! },
  backend: async ({ model, prompt, params }) => ({
    output: await yourModel(model, prompt, params),
  }),
});

// Returns when the model returns. Evidence is produced out-of-band.
const { output } = await cool.complete({
  model: "phala/deepseek-v4-pro@2026.07",
  prompt: "Assess application A-40182…",
  params: { temperature: 0.2 },
});

// The other half: a change to the AI system itself.
await cool.change({
  kind: "prompt",
  ref: "billing/refund-agent#system",
  before: previousPrompt,
  after: nextPrompt,
  actor: { id: "ci:github-actions", method: "oidc" },
  approval: { policy_id: "POL-014", decision: "approved", approvers: ["priya@bank.example"] },
});
```

### Production

```ts
import { CoolTee, HttpDstackClient, remoteQuoteVerifier } from "cool-nwc";

const cool = await CoolTee.connect({
  dstack: new HttpDstackClient({ endpoint: "/var/run/dstack.sock", vendor: "intel-tdx" }),
  expectedMeasurement: PINNED_MEASUREMENT,   // the image you reviewed
  policy: {
    expectedMeasurement: PINNED_MEASUREMENT,
    allowSimulated: false,                   // no simulator in production, ever
    requireVendor: ["intel-tdx"],
    verifier: remoteQuoteVerifier({ endpoint: QUOTE_VERIFIER_URL, root: "intel-dcap" }),
  },
});

if (!cool.handshake.ok) logger.error({ steps: cool.handshake.steps }, "attestation failed");
```

There is no signing key to configure. There cannot be one — it is derived inside
the enclave from the measurement.

Without a `dstack` client the SDK runs its **simulator**: the same code path, the
same receipts, structurally complete quotes under a CooL-held root. Every such
receipt is labelled `simulated` in its own attestation block, and the verifier
reports `simulated` — never `pass` — on the two domains that depend on hardware.

### Verify

```ts
import { verifyReceiptV2 } from "cool-nwc";

const verdict = await verifyReceiptV2(receipt, {
  expectedMeasurement: PINNED_MEASUREMENT,
  requireHardware: true,
});

verdict.ok;                     // false unless every domain that can pass, did
verdict.checks.enclave.detail;  // quote ↔ measurement ↔ signing key
```

The seven domains: `binding`, `signature`, `inclusion`, `witnesses`,
`attestation`, `enclave`, `anchor`. Each fails independently and means something
different; the verifier never collapses them into one tick.

## What it proves — and what it does not

**Proves:** the record's contents match its commitment; both signatures verify;
the entry is in the log under a validly signed tree head; and the quote it names
attests the very key that signed it.

**Does not prove:** that the model's output was correct, fair, safe or
compliant. CooL records what happened; it does not grade it. `witnesses` and
`anchor` are honestly reported as absent — no external witness gossip and no
public-chain anchoring exist yet.

## Entry points

| Import | Contents |
|---|---|
| `cool-nwc` | everything (recommended) |
| `cool-nwc/phala` | the confidential-compute tier only — no `ajv`, smallest browser footprint |
| `cool-nwc/v1` | the v1 evidence core and `cool.receipt.v1` verifier |

Node ≥ 20, or any runtime with WebCrypto and `btoa`/`atob`. Works in browsers,
Deno, Bun, Cloudflare Workers and Node.

## Links

- Live console, IDE and an in-browser verifier you can attack:
  <https://northwindcipher.com/studio>
- SDK reference and install paths: <https://northwindcipher.com/sdk>
- Conformance vectors: <https://northwindcipher.com/cool-vectors>

Apache-2.0 · Northwind Cipher Pvt. Ltd.
