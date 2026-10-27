# Architecture

*Where the evidence actually runs today, the one trust boundary that matters, and what breaks when something fails.*

One decision does most of the architectural work here: nothing that proves
anything runs on a server you have to trust. The SDK, the CLI, the verifier
and the local transparency log all run in your own process or your own
confidential VM. CooL's own infrastructure — today, a licensing and update
channel — never sees a customer's prompts, diffs, or receipts, and has no
code path that could forge one, because it holds no signing key for your
deployment.

> [!NOTE]
> The interactive version of this page, with diagrams, is at [/architecture](https://northwindcipher.com/architecture).
> This page covers the same ground for a reader who wants it as text they can
> link into a review.

## What actually runs, today

The shipped SDK (`cool-nwc` / `cool-tee` on npm) and CLI are TypeScript —
`@noble/curves`, `@noble/hashes` and `@noble/post-quantum` for the
cryptography, a hand-rolled RFC 6962 Merkle tree (`.cool/log/` on disk, one
tree per project), and OpenTimestamps for Bitcoin anchoring. There is no
server component in the critical path: `cool seal` and `cool verify` are
both local operations against local state.

```text
your process
  ├─ capture         — CoolTee.change(), an async queue, never on the request path
  ├─ evidence engine — canonicalise → hash → ML-DSA-65 + Ed25519 sign
  ├─ transparency log — RFC 6962 tree in .cool/log/, appended across runs
  └─ verifier         — cool verify, offline, no network calls

your confidential VM (optional; Phala Cloud Intel TDX today)
  └─ the same evidence engine, with keys derived from the measurement
     rather than stored — see the attestation guide
```

See the [CLI reference](cli-reference.md) for every command and the
[receipt spec](receipt-format.md) for exactly what gets signed.

## The trust boundary

Capture, signing, and the log all live in your environment. The only thing
that crosses to CooL is a licence check and, if you opt in, an update
channel — neither carries evidence. That split is what makes "CooL cannot
alter a record you already hold" a property of where the bytes live rather
than a promise about our intentions. See the
[threat model](threat-model.md) for what is and is not removed from the
trust set by this.

## Failure model

An infrastructure product is bought or rejected on this table more than on
any single feature.

| When this happens | This is what you get |
|---|---|
| CooL (the licence/update channel) is unreachable | Your inference is unaffected — capture is never on that path. Events queue; what cannot be queued is counted, and the count is written as a signed entry, so loss is recorded rather than silent. |
| The capture agent crashes | Your application keeps serving. Capture is out-of-band and non-throwing by construction — the call is an array push behind a queue. |
| The enclave measurement changes | A different signing key is derived. Receipts pinned to the old measurement stop verifying against the new one — the intended alarm, not a bug. |
| An RA-TLS peer fails attestation | The channel never opens and nothing is transmitted. Fail-closed toward the network, fail-open toward your application. |
| The log operator misbehaves | Detectable by a witness, if one has co-signed — see the [witness guide](witness.md). Not detectable from the log alone, which is why that guide exists. |
| A signing algorithm is broken | Records carry ML-DSA-65 and Ed25519, both required. A break in one family does not forge a record. |

## Where this is going

CooL's longer-term architecture — a Rust evidence engine, a durable ingest
queue, a reused transparency-log implementation (Trillian/Rekor rather than
the current hand-rolled tree), and managed multi-tenant/BYOC/on-prem
deployment — is the Gate 2 and Gate 3 target, not what ships today. See
[limits](limits.md) for exactly what that gap is, item by item, rather
than a target architecture described in the present tense.
