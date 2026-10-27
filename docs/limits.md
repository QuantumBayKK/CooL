# Limits

*What is real today, what is not, and what has to be true before each gap closes. The roadmap, labelled as a roadmap.*

CooL is at **Stage 0** of a published four-rung readiness ladder
(`src/content/gates.ts`), and a build-time scanner fails CI if any public
page claims a phrase reserved for a rung above the one the product has
actually reached. This page is that ladder's "what is not real" column,
written out — the roadmap items below are **planned**, not shipped, and
nothing on this page is a promise about a date.

## What is real today

- Hash → hybrid-sign → transparency log → offline verifier, end to end —
  ML-DSA-65 (FIPS 204) and Ed25519 over deterministic CBOR, appended to an
  RFC 6962 log.
- Tamper-evidence proven by attack, not by assertion — the conformance run
  edits a byte and confirms `binding` and `signature` both reject it.
- The policy engine, selective disclosure, and audit-pack export.
- `cool verify --require-hardware` genuinely refuses a receipt without a
  vendor-rooted quote, however many other domains pass.
- Hardware attestation on real Phala Cloud Intel TDX hardware — all seven
  verifier domains checked against a genuine Intel-rooted quote, confirmed
  independently with a local `dcap-qvl` check. See the
  [attestation guide](attestation.md).
- An independent witness co-signing the log from its own Phala CVM, with its
  own enclave-sealed key, on a different node.

## What is not real today

- **A witness run by a separate organisation.** Today's witness proves key
  and process separation — a different CVM, a different key — but runs
  under the same CooL account as the primary log. Against a determined
  insider at CooL, that is not yet sufficient; see
  [the witness guide](witness.md) and the
  [threat model](threat-model.md#still-in-the-trust-set). **Gate 2.**
- **Confidential-GPU attestation.** The schema carries a `GpuAttestationRef`
  and the hardware runs today are CPU Intel TDX only. No confidential-GPU
  attestation is claimed. **Gate 2.**
- **Automatic capture.** Sealing a record is a deliberate CLI/SDK call
  today, not an automatic hook into a gateway or framework. **Gate 1.**
- **Multi-tenant SaaS, SSO, on-prem, and any certification.** Single node,
  no identity federation, no SOC 2 / ISO 27001 / HIPAA mapping. **Gate 2–3.**
- **A Bitcoin-anchored log, counted as a finished safeguard.** `cool anchor`
  is implemented — submission to four OpenTimestamps calendars, block
  collection, and offline verification against a real block header all run
  today, and the verifier's `anchor` domain reports `pending` honestly while
  that is in flight. What is not yet true is the readiness-ladder claim that
  public anchoring is a *relied-upon* part of the log's integrity story —
  that is still a **Gate 2** item, tracked separately from the mechanism
  working.

## Reading this table honestly

"Not real today" does not mean broken; it means the honest state is encoded
in the product rather than asserted around it. A `simulated` attestation, an
`absent` witness count, or a `pending` anchor are not failures to hide — they
are the verifier refusing to round up. See the
[verifier reference](verifier-reference.md#statuses) for every status a
domain can report and exactly what each one means.

## When a gate closes

Raising what this documentation — or the website — may claim is a one-line
edit to `CURRENT_GATE` in `src/content/gates.ts`, and CI rejects that change
until the items justifying the new rung are actually ticked. The scanner that
enforces this caught a real over-claim in existing copy the first time it
ran; it is not a formality.
