# CLI reference

*Every cool command — synopsis, flags, and a worked example. The same manual cool help prints, as a page.*

This page mirrors `cool help`, command by command. It exists so a command can
be read, linked and searched without a terminal open; the CLI's own `--help`
output is generated from the same source, so the two can never drift apart.

```bash
cool help               # this index, in a terminal
cool help <command>     # one command, in full, with examples
cool help <concept>     # the explanation behind it — attestation, witnesses, …
```

## walkthrough

A paced, interactive tour. It seals a real record, verifies it, breaks it,
shows the policy engine refusing something, opens one committed field without
revealing the rest, and ends with an audit pack. Everything it does is real
and stays in the current directory afterwards.

```bash
cool walkthrough   # press Enter between steps
```

## status

What this environment can currently prove: silicon and mode, the measurement
registers the signing key was derived from, every step of the RA-TLS
handshake, and how many records are in the log.

```bash
cool status
cool status --json   # for a health check
```

## seal

`cool seal <kind> <ref> [text]`

Records a change to an AI system — a prompt edit, a model bump, a widened
agent permission. The plaintext is committed as a salted hash and discarded;
the record is signed with the enclave-derived key and appended to the
transparency log. If a policy is configured, its decision is evaluated here
and sealed with the change.

```bash
cool seal prompt billing/agent#system "Approve refunds up to $500."
cool seal model credit/underwriting#scorer "deepseek-v4-pro" --approvers a@x,b@x
COOL_ENV=prod cool seal params kyc#inference '{"temperature":0.2}'
```

`kind` is one of `prompt`, `model`, `params`, `policy`, `dataset`,
`agent-permission`, `tool`.

| Flag | Does |
|---|---|
| `--approvers a@x,b@x` | Who signed off; the policy weighs these. |
| `--risk 0.9` | A risk signal from your own model, 0–1. |
| `--label tier:high` | Repeatable; policies can match on labels. |

## verify

`cool verify [file|last|all]`

The offline verifier. See the [verifier reference](verifier-reference.md)
for what each of the seven domains checks.

```bash
cool verify last
cool verify all                                  # exit 1 if any fails
cool verify ./receipt.json --require-hardware    # refuse anything not backed by real silicon
```

| Flag | Does |
|---|---|
| `--require-hardware` | A simulated attestation is no longer acceptable. |
| `--json` | The verdict as JSON. |

## records

`cool records [--kind …] [--ref …] [--env …]`

Filter and list sealed records: what changed in production last week, what an
actor touched, what went out without a human.

```bash
cool records
cool records --kind prompt --env prod
cool records --actor ci: --decision rejected
```

| Flag | Does |
|---|---|
| `--kind <k>` | prompt, model, params, policy, dataset, agent-permission, tool |
| `--ref <text>` | Substring of the change ref or model id. |
| `--env <name>` | Environment, e.g. `prod`. |
| `--actor <text>` | Substring of the actor id. |
| `--decision <d>` | approved, auto-approved, rejected |
| `--limit <n>` | Cap the output. |

## policy

`cool policy [test <kind> <ref>]`

Policy is evaluated inside the enclave and its verdict is sealed with the
change, so an approval cannot be edited afterwards. Prints the active rule
set with the reasoning behind each rule, or dry-runs a hypothetical change.

```bash
cool policy
cool policy test agent-permission support/copilot#tools --env prod
```

## disclose

`cool disclose <record> <field> <value>`

A receipt commits to prompts and diffs as salted hashes, so it can be
published. This opens one field at a time: the plaintext plus its salt, which
anyone can recompute against the sealed commitment. One field opens;
everything else stays closed.

```bash
cool disclose last change.after "Approve refunds up to $500."
cool disclose <id> input --out disclosure.json
cool disclose --check disclosure.json   # verify one you were given
```

## witness

`cool witness [cosign|list]`

Independent co-signatures on the log. See the [witness guide](witness.md).

```bash
cool witness cosign --key auditor
cool witness list
```

## anchor

`cool anchor [submit|upgrade|verify|export|status]`

Commits the current tree head to Bitcoin so it cannot be backdated. See
[anchoring, in the witness guide](witness.md#anchoring-to-bitcoin).

```bash
cool anchor submit            # timestamp the current head — free, no key needed
cool anchor upgrade           # collect the Bitcoin block once aggregated
cool anchor verify            # check the commitment against the block header
cool anchor export head.ots   # write a proof anyone can check with `ots`
```

## pack

`cool pack [build|verify <file>]`

One self-contained file with every receipt, the keys to check them, the
pinned measurement and the clause mapping. `pack verify` re-derives
everything rather than trusting the pack's own summary — it is meant to be
checked by someone who does not trust you.

```bash
cool pack build --out audit.json
cool pack verify audit.json
```

## compliance

`cool compliance [--gaps]`

Maps EU AI Act, DPDP, ISO 42001, SOC 2 and RBI clauses onto the receipt
fields that satisfy them, and counts the records behind each. Coverage is
computed, never asserted — an obligation with no evidence reports zero and
says what would fix it.

```bash
cool compliance
cool compliance --gaps   # only what is uncovered
```

## ui

`cool ui [folder]`

Opens a folder, seeds a baseline from git so the first change is a real
diff, and seals every save into the project's own on-disk log — the same
console the website demonstrates, pointed at your files and your hardware.
Bound to loopback by default: it can read your source and seal records, so
it is not meant to be reachable from anywhere else.

```bash
cool ui
cool ui ./agents --env prod
cool ui --host 0.0.0.0 --no-open   # inside a CVM, behind the gateway
```

| Flag | Does |
|---|---|
| `--port <n>` | Listen somewhere other than `4319`. |
| `--host <addr>` | Bind address; defaults to `127.0.0.1`. |
| `--env <name>` | Environment recorded on each change (default: `COOL_ENV` or `dev`). |
| `--no-open` | Do not launch a browser. |

## attest

Prints the attestation this environment can produce: quote format, root of
trust, TCB status, the 64 bytes bound into `report_data`, and all five
measurement registers. On a laptop this is the simulator, and it says so.

```bash
cool attest
```

## log

`cool log [--consistency <n>]`

Tree size, current root, the last signed tree head, and where the log lives
on disk — one tree per project, appended to across runs.

```bash
cool log
cool log --consistency 12   # prove the tree only grew since size 12
```

## stats

Volume, verdicts, and capture cost — measured on this machine, not quoted
from a datasheet.

```bash
cool stats
```

## update

`cool update [version]`

Upgrades in place by shelling out to `npm install -g`, rather than
replacing itself — nothing happens that you could not have typed.

```bash
cool update
cool update --check   # exit 1 if an update exists; for CI
cool update 2.4.0      # install an exact version
```

## doctor

Checks Node, WebCrypto, whether a dstack endpoint and a quote verifier are
configured, that the channel opens, and that a seal-and-verify round trip is
clean. Exits non-zero when something is missing — including the honest case
of a laptop with no confidential VM.

```bash
cool doctor
```

## help

`cool help [command|topic]`

This manual. With no argument, the command list and the concept index.

```bash
cool help verify
cool help attestation   # the concept, not the command
cool help concepts
```
