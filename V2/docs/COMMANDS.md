# `cool` — every command, and why Phala needs it

Install once, then `cool` works from any directory. The interactive prompt and
the argument form run the same code: `cool verify last` and `/verify last` are
the same function, so anything a demo can do, a CI job can do too.

---

## Install

```bash
npm i -g cool-nwc          # the CLI, globally
cool                       # opens the interactive console
```

In a project:

```bash
npm i cool-nwc             # the SDK
```

```ts
import { CoolTee } from "cool-nwc/phala";
const cool = await CoolTee.connect();
```

If the registry is unreachable, the domain serves the same tarball:

```bash
npm i -g https://northwindcipher.com/sdk/cool-nwc-2.3.0.tgz
```

## Update

```bash
cool update                # check the registry, install, prove the new binary answers
cool update --check        # report only; exits 1 when behind (useful in CI)
cool update 2.3.0          # pin an exact version, or roll back to one
```

`cool update` exists because the alternative people were doing was
uninstall-then-reinstall: three commands, easy to get wrong on Windows, where
the `cool` shim outlives a half-removed package. It shells out to
`npm install -g` — no self-replacing binary, nothing you could not run yourself
— and then runs `npm ls -g` to prove the version actually changed. The running
process keeps the old code; the new one is live on the next invocation.

The CLI also checks the registry in the background at most once a day and prints
one line when a newer version exists. It is off under CI and under
`COOL_NO_UPDATE_CHECK=1`, with a 2.5s timeout, and it never blocks a command.

## Uninstall

```bash
npm rm -g cool-nwc
```

If a stale shim survives (this happens when an older package was removed while
its shim was in use):

```powershell
Remove-Item "$env:APPDATA\npm\cool*" -Force          # Windows
```
```bash
rm -f "$(npm prefix -g)/bin/cool"                    # macOS / Linux
```

---

## The commands

### `cool` — the console
Opens the interactive session: enclave panel, key id, channel state, receipt
count. Everything below can be typed at the prompt with a leading `/`.

**Why it matters for Phala:** it is the thirty-second version of the pitch. A
prospect installs one package and sees a TEE-backed evidence plane running, with
its mode stated honestly, before reading any documentation.

### `cool status`
Vendor, mode (`mock` / `simulated` / `hardware`), app and instance id, MRTD and
RTMR3, the signing key derived from the measurement, log size, and the RA-TLS
handshake step by step.

**Why:** this is where a dstack deployment proves it is a dstack deployment. The
key id is derived from the measurement, so `status` showing a new key after a
redeploy *is* the measurement changing — visible without reading a quote.

### `cool wire`
Walks the five steps between simulated and pass — hardware, guest agent, quote
in the seal path, vendor verifier, end-to-end proof — stops at the first unmet
one and prints the exact command that fixes it. Ends by sealing a probe record
and verifying it under `--require-hardware`.

**Why:** the failure modes of a dstack integration look alike from the outside.
This turns "attestation is simulated, why?" from a support ticket into one
command. It is the on-boarding path for every Phala customer deploying CooL.

### `cool seal <kind> <ref> <text>`
Seals a change record: commit → bind → hybrid-sign (ML-DSA-65 + Ed25519) →
append to the transparency log. Kinds: `prompt`, `model`, `params`, `policy`,
`dataset`, `agent-permission`, `tool`.

**Why:** this is the product. Every configuration change to an AI system becomes
an append-only, TEE-attested record. Phala sells confidential compute; this is
what a customer *does* with it on day one.

### `cool verify [last|all|<file>] [--require-hardware]`
Verifies a receipt across seven domains: `binding`, `signature`, `inclusion`,
`witnesses`, `attestation`, `enclave`, `anchor`. `--require-hardware` refuses to
pass anything that is not backed by verified silicon.

**Why:** verification is offline and needs no CooL service. An auditor, a
regulator, or Phala itself can check a receipt without trusting the party that
produced it. `--require-hardware` is the flag that makes a TEE deployment
materially different from a database with a signature column.

### `cool records` / `cool ls`
Lists sealed receipts with kind, ref, environment, actor, and verdict.

**Why:** the operator's view of what the enclave has attested to, without
opening a dashboard.

### `cool disclose <receipt> <field>`
Produces a disclosure that reveals one committed field and proves it matches the
commitment — the rest stays hidden. Refuses to build a disclosure whose value
does not match.

**Why:** confidential compute that cannot selectively reveal is unusable for
compliance. A regulator asking "what was the prompt on 3 March" gets exactly
that field, cryptographically bound to the sealed record, and learns nothing
else. This is the answer to the strongest objection to putting AI in a TEE:
"then how do you audit it?"

### `cool witness cosign --key <name>` / `cool witness list`
Co-signs the current signed tree head with an independent key and attaches it to
receipts. Rejects a co-signature whose log id, size, root, or timestamp does not
match.

**Why:** it makes the `witnesses` domain passable by someone who is not CooL. A
transparency log that only its operator vouches for is a ledger, not a proof.

### `cool anchor [submit|upgrade|verify|export|status]`
Commits the current tree head into a Bitcoin block via OpenTimestamps. `submit`
hands the head's root hash to four independently operated public calendars;
`upgrade` collects the block once they have aggregated it (about an hour);
`verify` recomputes the commitment and matches it against the block's merkle
root; `export` writes a standard `.ots` file. Until the header check succeeds the
domain reads `pending`, never `pass`.

**Why:** it is the only domain that is not a signature. Every other proof says
"someone holding this key asserts X" — which whoever holds the key can produce at
any time, including about a past they would prefer. A block header cannot be
backdated, so an anchored head provably existed before that block was mined even
if the enclave key is later compromised. For Phala this is the answer to "what if
the operator is the adversary?", and it costs nothing: no gas, no wallet, no key.
Point `BITCOIN_HEADER_URL` at your own node and the proof depends on no third
party at all.

### `cool log [--consistency <n>]`
Shows tree size, root, the signed head, and proves that the tree only grew
between two sizes.

**Why:** RFC 6962 consistency is what rules out a rewritten history. Without it,
an operator with the signing key could replace the past.

### `cool policy [--check]`
Shows the policy set evaluated *inside* the enclave and the decision sealed into
each record — allow, escalate, or block, with the rule that fired.

**Why:** the decision is made where the code is measured, so the record carries
not just what changed but what the system was permitted to do about it. That is
the difference between logging and governance, and it is only trustworthy inside
a TEE.

### `cool compliance`
Maps sealed evidence to obligations — EU AI Act Art. 12/14/15, DPDP §8,
ISO 42001 §9, SOC 2 CC7.2, RBI — counted from receipts, never assumed. Names the
gaps.

**Why:** it converts "we run on Phala" into "here is Article 12 coverage,
counted." That is the sentence that gets a confidential-compute line item
approved by a compliance team.

### `cool pack`
Builds an audit pack — receipts, tree heads, proofs, obligation coverage — and
verifies one by re-deriving the summary rather than trusting it.

**Why:** the deliverable an auditor keeps. Verifiable offline, months later,
against a CooL that no longer exists.

### `cool stats`
Analytics over sealed records: volume, kinds, environments, actors, verdict
distribution, capture latency (p50/p99).

**Why:** shows that the evidence path is not a bottleneck. Capture is async and
non-blocking, which is what makes this deployable in front of production
inference.

### `cool attest`
Fetches a fresh quote and shows the measurement, the report data binding, and
the root that verified it — or says plainly that nothing verified it.

**Why:** the raw dstack round trip, visible. Useful when debugging a CVM, and
useful when someone asks to see the actual quote.

### `cool export <file>`
Writes receipts as JSON for external tooling.

### `cool doctor`
Environment check: Node version, install integrity, endpoint reachability, key
derivation, log health. The container's `HEALTHCHECK` runs it.

**Why:** a health check that exercises the real path rather than pinging a port.
A container that cannot derive a key is unhealthy even if the process is alive.

### `cool walkthrough` / `cool tour`
Six guided steps from first seal to audit pack, running real commands against
the real plane.

**Why:** it found a genuine policy bug during development (an approved change
was escalating anyway). A walkthrough that runs the real code is a test.

### `cool help [command|concept]`
Thirteen command pages and ten concept pages — measurement, report_data,
inclusion, consistency, witnesses, disclosure, and the rest — offline, in the
terminal.

---

## Environment

| variable | meaning |
| --- | --- |
| `DSTACK_ENDPOINT` | guest agent socket (`/var/run/dstack.sock`) or URL |
| `DSTACK_SIMULATOR_ENDPOINT` | fallback used when the above is unset |
| `QUOTE_VERIFIER_URL` | vendor verifier — the only way `attestation` passes |
| `QUOTE_VERIFIER_KEY` | token for the verifier, if it needs one |
| `COOL_PIN_MRTD` / `COOL_PIN_RTMR3` | expected measurement; a mismatch fails `enclave` |
| `COOL_ENV` | environment label written into records (`dev`, `prod`, …) |
| `COOL_NO_UPDATE_CHECK` | silences the once-a-day registry check |

Deployment runbook: [`deploy/README.md`](../deploy/README.md).
