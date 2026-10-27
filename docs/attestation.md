# Attestation guide

*What a TEE quote actually proves, what it spends its 64 bytes on, and what it cannot tell you.*

A confidential VM can produce a quote: a statement signed by the CPU saying
"this exact measurement is running, and here are 64 bytes it asked me to
include." That sentence is doing almost all of the work in this product, so
it is worth being precise about what it does and does not cover.

## What gets measured

A quote's `body.measurement` is five registers:

| Register | What changes it |
|---|---|
| `mrtd` | Build-time measurement of the TD image. Changes if a single byte of the deployed image changes. |
| `rtmr0`–`rtmr2` | Runtime-extended by the platform during boot. |
| `rtmr3` | Extended as the application runs — dstack writes the app-compose digest, instance identity and event log here. |

Both halves are pinned by whoever deploys CooL. That is what makes "this is
running unmodified CooL code" a checkable statement about specific bytes,
rather than a promise about a vendor's intentions.

## The 64 bytes that tie it together

A quote lets the attested code bind 64 bytes of its own choosing into
`report_data`. CooL spends all 64 on a commitment to the public half of its
own signing key — see `key_binding` in the [receipt spec](receipt-format.md#attestation).

That single decision is what turns two separate claims into one chain. Without
it, "this code was attested" and "this key signed this record" are two
assertions a reader has to correlate by trusting somebody in between — maybe
CooL, maybe whoever wired the enclave up. With it, a verifier recomputes the
commitment from the receipt's own `key_directory`: if it matches, the code
that was attested is, mechanically, the code that holds the signing key. This
is the `enclave` domain in the [verifier reference](verifier-reference.md#enclave),
and it is the one domain `cool.receipt.v1` could not have.

## What a quote is not

A quote says nothing about whether the output was correct, fair, or safe —
only that specific, measured code produced it. It is an integrity and
provenance primitive, not a correctness one.

> [!IMPORTANT]
> On a machine with no confidential VM — a laptop, most CI runners, a browser —
> `cool` falls back to a built-in simulator. The quote it produces is
> structurally complete and cryptographically real: a genuine signature over a
> genuine quote structure, with a genuine key-binding. What it is missing is
> Intel or AMD as the root of trust, so it is worth exactly nothing as evidence
> of confidentiality. The verifier reports this as `simulated`, never as `pass`,
> and no presentation layer downstream of the verifier can change that —
> `--require-hardware` refuses it outright. See [limits](limits.md).

## Where it runs today

Receipts sealed inside a Phala Cloud Intel TDX confidential VM carry a
genuine vendor-rooted quote, checked two ways: against Phala's own
attestation service and against a local `dcap-qvl` check, independent of
Phala. `mrtd` and `rtmr0`–`rtmr3` are pinned, and `report_data` is confirmed
bound to the signing key actually used. AMD SEV-SNP and an NVIDIA
confidential-GPU attestation reference exist in the schema (`TeeVendor`,
`GpuAttestationRef`) but are not wired to a live deployment — see
[limits](limits.md) for what that means concretely.

## Going to production

Three things change from the default (simulated) configuration:

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

`DSTACK_ENDPOINT` points at the guest agent inside the confidential VM, so
quotes come from silicon instead of the simulator. `QUOTE_VERIFIER_URL`
chains those quotes to Intel or AMD rather than merely reporting them —
without one configured, a real hardware quote verifies as `absent`, not
`pass` (see the `attestation` domain). And `expectedMeasurement` pins the
image that was reviewed: without a pin, a quote proves "some TEE"; with one,
it proves "the code we approved". The pin belongs in version control next to
the code it pins, so updating it requires a human who looked at the diff.

## Next

- [Witness guide](witness.md) — attestation proves *where*; witnesses and anchoring prove *who else saw it* and *when*
- [Limits](limits.md) — exactly which vendors and modes are real today
- [Receipt spec](receipt-format.md) — the `attestation` block's exact fields
