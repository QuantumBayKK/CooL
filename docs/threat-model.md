# Threat model

*What CooL defends against, what it does not, and who you still have to trust.*

The useful question about an evidence system is not what it proves but who it
still requires you to trust.

## Removed from the trust set

**CooL, for record contents.** You recompute every digest and signature
yourself with a published verifier. We cannot alter a record you already hold.

**CooL, for signing keys.** Keys are derived inside the enclave from the
measurement. There is no escrow — we have no copy to surrender, and no code path
that would produce one.

**The network.** Verification makes zero network calls, and on the website that
count is measured rather than claimed.

## Still in the trust set

**CooL, for log history.** A transparency log signed only by its operator is
tamper-evident against outsiders and *not* against the operator. Against a
determined insider at CooL, the log alone is not sufficient. An attested witness
now runs in its own Phala CVM with a separate enclave-sealed key, but under the
same account — a witness operated by another organisation closes this fully.

**The hardware vendor.** A TEE attestation roots in Intel's signing key. If you
do not trust the vendor, attestation proves nothing to you. No design removes
this.

**Your own operators.** CooL records what your people did. It does not prevent
them doing it, and was never intended to.

## Attacks and outcomes

| Attack | Outcome |
|---|---|
| Edit a record after sealing | `binding` and `signature` both fail |
| Re-sign with a different key | `signature` fails against the pinned key |
| Staple a quote from another image onto a record | `enclave` fails — the quote's `report_data` commits to a different signing key |
| Redeploy from a patched image | A different key is derived inside the enclave; the old pin no longer verifies |
| Drop a record from the log | `inclusion` fails for that record |
| Rewrite log history | `cool log --consistency <n>` fails between the old and new tree heads |
| Insider at CooL rewrites the whole log, including history before any witness co-signed | **Not detected today.** Needs an organisationally independent witness. |
| Backdate a tree head by signing it later and claiming an earlier time | **Not detected without a Bitcoin anchor.** A signature alone never proves *when* — see [anchoring](witness.md#anchoring-to-bitcoin). |

See the [verifier reference](verifier-reference.md) for what each of the
seven domains — `binding`, `signature`, `inclusion`, `witnesses`,
`attestation`, `enclave`, `anchor` — actually recomputes.

## Failure model

Capture is asynchronous, out-of-band and fail-open. If CooL is unreachable your
inference continues; events queue, and what cannot be queued is counted with the
count itself written as a signed entry. Loss is recorded, never silent.

RA-TLS is the opposite direction: fail-closed toward the network. A measurement
mismatch means the channel never opens and nothing is transmitted.
