# Documentation

*Install the SDK, seal a record, and verify it offline with a verifier we do not control.*

CooL seals every change to an AI system — a prompt edit, a model swap, a
permission grant — as a signed, tamper-evident record called a **receipt**.
This documentation covers producing those records and, more importantly,
checking them.

## New here? Start with these three

- **[1 · Quickstart](quickstart.md)** — Install the SDK, seal your first record, and verify it — five minutes, start to finish.
- **[2 · Verify it yourself](verify-it-yourself.md)** — Check that record without taking CooL's word for anything, including the network.
- **[3 · Architecture](architecture.md)** — A five-minute map of where everything runs, before the reference pages below assume you know it.

## Five words you'll see everywhere

Reference pages below use these without redefining them each time.

| Term | In one sentence |
|---|---|
| **Receipt** | The JSON document CooL produces for one change or one inference — see the [receipt spec](receipt-format.md). |
| **TEE** | *Trusted execution environment* — a confidential VM that can cryptographically prove what code is running inside it. |
| **Attestation** | The TEE's signed statement of what code is running — see the [attestation guide](attestation.md). |
| **Transparency log** | An append-only, tamper-evident history of every receipt. Removing an old entry is detectable. |
| **Witness** | An independent party who co-signs the log's history, so CooL alone can't rewrite it — see the [witness guide](witness.md). |

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

## Reference

For when you know what you're looking for.

- **[Receipt spec](receipt-format.md)** — The cool.receipt.v2 schema, field by field.
- **[Verifier reference](verifier-reference.md)** — The seven domains, every status they can report, and how ok is computed.
- **[CLI reference](cli-reference.md)** — Every cool command, flags and worked examples.
- **[Attestation guide](attestation.md)** — What a TEE quote proves, what it doesn't, and where it runs today.
- **[Witness guide](witness.md)** — Why a log signed only by its operator isn't enough — witnesses and Bitcoin anchoring.
- **[Threat model](threat-model.md)** — Who is removed from the trust set, who is still in it, and why.

## Operations

- **[Limits](limits.md)** — What is real today, what is planned, and which gate each gap belongs to.
- **[Licence FAQ](license-faq.md)** — What is Apache-2.0, what is not, and where the boundary sits.
