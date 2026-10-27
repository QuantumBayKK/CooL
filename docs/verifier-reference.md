# Verifier reference

*The seven domains the offline verifier checks, what each one recomputes, and every status it can report.*

`cool verify` runs seven independent checks against a receipt and reports each
one separately, rather than collapsing them into a single pass/fail. A
receipt can be genuinely signed and still worth rejecting — "the signature is
valid" and "this proves what you think it proves" are different questions,
and conflating them is how a verifier becomes decoration.

```bash
cool verify ./receipt.json              # all seven domains, human-readable
cool verify ./receipt.json --json       # the verdict as JSON
cool verify ./receipt.json --require-hardware   # refuse anything not backed by real silicon
```

Needs no enclave and no network. Everything below is recomputed from the
bytes in the receipt plus, optionally, keys or a measurement the verifier
already trusts — never fetched.

## Statuses

Six values, deliberately not flattened into pass/fail:

| Status | Meaning |
|---|---|
| `pass` | Checked, and it held. |
| `fail` | Checked, and it did not. The verdict is `REJECTED` regardless of what else passes. |
| `absent` | The proof for this domain is not in the receipt. Not a failure by itself — `inclusion`, `witnesses` and `anchor` are allowed to be absent — but it means this domain contributes nothing. |
| `mock` | No attestation path exists at all. What every `cool.receipt.v1` record reports. |
| `simulated` | A structurally real quote exists, under a CooL-held root rather than a vendor one. Real signature, real binding, no hardware root — never promoted to `pass`. |
| `pending` | An anchor was submitted but the Bitcoin calendars have not yet aggregated it into a mined block. |

## binding

Recomputes the canonical CBOR of the record's core, hashes it, and compares
the result to `binding_hash`. Pure arithmetic — no key, no network, no trust
in anybody. If this fails, nothing else about the receipt is worth checking:
the document does not describe the record it claims to.

## signature

Both halves of the hybrid signature must verify over the canonical core:
ML-DSA-65 (FIPS 204, post-quantum) and Ed25519 (classical), against the
public keys in `key_directory` or, if the verifier supplies its own
(`--trust-key`), against those instead. A break in one family alone does not
forge a record — that is the whole point of requiring both.

## inclusion

Walks `inclusion.audit_path` from the record's leaf to `sth.root_hash`,
RFC 6962-style, and confirms the signed tree head's own signature verifies.
This proves *position in history* rather than asserting it: a record that
passes `binding` and `signature` but was never logged still fails here if a
proof was expected. `absent` is acceptable only for a receipt sealed before
the log confirmed the entry.

```bash
cool log --consistency 12   # separately: prove the tree only grew since size 12
```

## witnesses

Counts the independent co-signatures on `sth.witnesses` — entries with
`external: true`. CooL's own signature on its own tree head is always
present and **never** counted; the verifier has enforced that since v1.
`pass` requires at least one external witness; otherwise the domain reads
`absent`, which is the honest state until [a witness](witness.md)
co-signs.

## attestation

Checks whether the attached quote chains to a real hardware root. `pass`
only with a genuine vendor-rooted quote (Intel DCAP / AMD KDS) and a real
quote verifier reachable to check it; `simulated` for the built-in
simulator; `mock` when no quote exists at all; `absent` when a hardware
quote is present in the receipt but no quote verifier was configured to
check it against a vendor root. See the [attestation guide](attestation.md).

## enclave

The domain v1 could not have. Recomputes the commitment the quote's
`report_data` carries and confirms it matches the signing key in
`key_directory` — so "an attested enclave holds this key" and "this key
signed this record" collapse into one checkable chain instead of two
assertions a reader has to correlate by trusting somebody. If a reader
pinned an `expectedMeasurement`, this is also where a redeployed, patched,
or substituted image gets caught: a different image derives a different
key, and the old pin stops matching.

## anchor

Recomputes the commitment `anchor.target` and matches it against the block
header the proof's `heights` point to. `pass` only once that recomputation
succeeds against a real Bitcoin block; `pending` between `cool anchor
submit` and the calendars' aggregation; `absent` when no anchor has been
submitted for this tree size at all. Anchoring is the one domain that
defends against a key holder backdating a tree head — see
[anchoring, in the witness guide](witness.md#anchoring-to-bitcoin).

## Reading a verdict

`verdict.ok` is computed from five of the seven domains, not all seven:

```text
ok = binding == pass
 AND signature == pass
 AND (inclusion == pass OR inclusion == absent)
 AND enclave != fail
 AND attestation != fail
```

> [!IMPORTANT]
> `witnesses` and `anchor` do **not** gate `ok` on their own. A receipt with no
> external witness and no Bitcoin anchor can still verify `ok: true` — the
> cryptography is genuinely sound, it is only the log operator's own honesty
> that nothing outside CooL has corroborated. Read both fields yourself before
> treating `ok: true` as "nothing left to check"; see the
> [threat model](threat-model.md#still-in-the-trust-set) for exactly what
> that gap means. `--require-hardware` additionally demands `attestation ==
> pass`, which `enclave`/`attestation` not being `fail` alone does not give you.

A `fail` on any domain adds a reason string to `verdict.reasons` naming which
check and why, so a rejection is never just "no".
