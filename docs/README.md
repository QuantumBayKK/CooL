# Documentation

*Install the SDK, seal a record, and verify it offline with a verifier we do not control.*

CooL seals every change to an AI system — a prompt edit, a model swap, a
permission grant — as a signed, tamper-evident record. This documentation covers
producing those records and, more importantly, checking them.

## Start with verification, not with capture

Most integration guides begin by telling you how to send them data. This one
begins with how to check what comes back, because that is the only part that
determines whether any of the rest is worth doing.

```bash
npm install -g cool-nwc
cool verify ./change-receipt.json   # makes no network calls — see /docs/verify-it-yourself
```

If you do not have a receipt yet, produce one in your browser at
[/verify](https://northwindcipher.com/verify) and download it. The verifier that runs on that page and the
one you just installed are the same implementation.

## What the verifier reports

Seven domains, each checked and reported separately — full detail in the
[verifier reference](verifier-reference.md).

| Domain | Proves |
|---|---|
| `binding` | The record's contents match its commitment |
| `signature` | ML-DSA-65 and Ed25519 both verify |
| `inclusion` | The record is in the log where it claims |
| `witnesses` | An independent party saw the same log |
| `attestation` | The quote chains to a real hardware root — or says it doesn't |
| `enclave` | The attested code is the code holding the signing key |
| `anchor` | The tree head is committed into a Bitcoin block |

> [!IMPORTANT]
> All seven have been verified on real Intel TDX hardware on Phala Cloud, with an
> attested witness running in a second CVM. A receipt sealed off-hardware — on a
> laptop or in a browser — still reports `attestation` as `simulated`, and that
> rule lives in the verifier, so no presentation layer can make it read as
> passing. See [limits](limits.md) for exactly what is and is not real today.

## Start here

- **[Quickstart](quickstart.md)** — Install, wire capture into an app, and seal your first record — five minutes.
- **[Verify it yourself](verify-it-yourself.md)** — Reproduce a record and check it without trusting CooL, the network, or this site.
- **[Architecture](architecture.md)** — Where each part actually runs today, and the one trust boundary that matters.
- **[Threat model](threat-model.md)** — Who is removed from the trust set, who is still in it, and why.

## Reference

- **[Receipt spec](receipt-format.md)** — The cool.receipt.v2 schema, field by field.
- **[Verifier reference](verifier-reference.md)** — The seven domains, every status they can report, and how ok is computed.
- **[CLI reference](cli-reference.md)** — Every cool command, flags and worked examples.
- **[Attestation guide](attestation.md)** — What a TEE quote proves, what it doesn't, and where it runs today.
- **[Witness guide](witness.md)** — Why a log signed only by its operator isn't enough — witnesses and Bitcoin anchoring.

## Operations

- **[Limits](limits.md)** — What is real today, what is planned, and which gate each gap belongs to.
- **[Licence FAQ](license-faq.md)** — What is Apache-2.0, what is not, and where the boundary sits.
