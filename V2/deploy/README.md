# Running CooL on real hardware

This directory is the whole on-prem deployment: a container image, a compose
file, and the dstack app manifest. Nothing in it is a demo — it mounts the guest
agent socket, derives its keys from the KMS, and pins the measurement.

Everything below is the path from *simulated* to *pass*. There are five steps,
and the order matters.

---

## What "pass" actually requires

CooL reports seven verdict domains. Four of them (`binding`, `signature`,
`inclusion`, `enclave`) pass from a laptop, because they are pure cryptography
over the receipt. Three of them cannot:

| domain | passes when | who provides it |
| --- | --- | --- |
| `attestation` | a **vendor root** verified the quote | Intel DCAP / Trust Authority |
| `witnesses` | an independent party co-signed the tree head | your auditor, not CooL |
| `anchor` | the tree head is posted somewhere public | not implemented |

A CooL self-signature is never counted as a witness, and a simulated quote is
never upgraded to a pass by pointing a hardware verifier at it. That is
deliberate: the product is worth nothing if `pass` is cheap.

---

## 1 · Get a confidential VM

```bash
cd deploy
phala deploy -c docker-compose.yml -n cool-evidence
```

This is the only step no code can do for you. Until the process is running
inside a TDX guest, `cool status` reports `mode: simulated` and every receipt it
seals says so in its own body.

To exercise the real protocol without a CVM, run Phala's dstack simulator — it
speaks the same RPC over the same socket, and CooL will talk to it happily:

```bash
dstack-simulator
export DSTACK_SIMULATOR_ENDPOINT=/tmp/dstack.sock
```

The mode still reads `simulated`, because the simulator has no silicon behind
it. What it proves is that your *wiring* is correct.

## 2 · Point CooL at the guest agent

```bash
export DSTACK_ENDPOINT=/var/run/dstack.sock
```

The compose file already sets this and mounts the socket. CooL fills
`report_data` with a commitment to its own signing key before asking for the
quote, which is what makes the quote about *your key* rather than about the box.

The socket is not a URL. `fetch` cannot open one, so CooL routes it through
`node:http` (`src/lib/cool/phala/unix.ts`) — unix sockets on Linux, named pipes
on Windows.

## 3 · Give it a vendor root to check against

```bash
export QUOTE_VERIFIER_URL=https://api.phala.network/attest/verify
export QUOTE_VERIFIER_KEY=<token, if the service requires one>
```

This is the step that turns `attestation` from `simulated` into `pass`, because
it is the first point at which anything checks a chain to Intel. Without it a
quote is *reported* — carried in the receipt, digested into the record — but
never *verified*, and the domain reads `absent`.

## 4 · Pin the measurement

```bash
phala cvms attestation <cvm-id>      # read MRTD / RTMR0-3
export COOL_PIN_MRTD=hex:<mrtd>
export COOL_PIN_RTMR3=hex:<rtmr3>
```

Now a receipt from a different image fails the `enclave` domain instead of
passing quietly. Pin before any data flows; a pin set afterwards proves nothing.

## 5 · Prove it

```bash
cool wire                 # walks steps 1-4 and stops at the first unmet one
cool seal prompt app#system "first sealed record on hardware"
cool verify last --require-hardware
```

`cool wire` seals a probe record and verifies it under `--require-hardware`, so
a green run means the whole path works, not that the configuration looks right.

---

## The three ways a REAL quote still fails

Each of these is the verifier working correctly. A tool that turned them green
would be worse than no tool.

**Measurement pin.** The deployed image's MRTD/RTMR differs from what you
pinned → `enclave` fails. It means the running code is not the code you
approved.

**TCB status.** Intel reports the platform's firmware or microcode as out of
date → the quote verifies but the platform is stale, and the verdict says so
rather than passing. Patch the host.

**report_data binding.** A quote that does not commit to the signing key proves
a TEE existed, not that it held your key. CooL writes that commitment
automatically and the `enclave` domain recomputes it from the receipt's own key
directory.

---

## Files

| file | what it does |
| --- | --- |
| `Dockerfile` | `node:22-alpine` + `cool-nwc`, health-checked with `cool doctor` |
| `docker-compose.yml` | mounts `/var/run/dstack.sock`, sets the endpoint, verifier and pins |
| `app-compose.json` | dstack app manifest — `kms_enabled`, KMS key provider, allowed envs |

Keys are derived through dstack-KMS from the measurement, so a redeploy that
changes the image changes the key. Old receipts stay verifiable against the old
key; new ones are signed by the new one. That is the intended behaviour — key
continuity across a code change would defeat the point of measuring the code.

## Witnesses and anchoring

`witnesses` is one command away once an auditor holds a key:

```bash
cool witness cosign --key auditor
```

`anchor` is not implemented. It needs tree heads posted to a public chain on a
schedule, and shipping a stub that says `pass` would be exactly the kind of lie
this system exists to prevent.
