# Witness guide

*Why a log signed only by its operator isn't enough, and the two independent mechanisms that close the gap — witnesses and Bitcoin anchoring.*

A transparency log signed only by its operator proves one thing: the
operator has not contradicted themselves — yet. It cannot prove they never
showed a different tree to somebody else, because the same key can sign two
different trees. Nothing about hybrid signatures, TEEs, or RFC 6962 math
closes that gap. Only an outside party can.

## Why witnesses exist

A witness is anyone independent who signs the tree heads they saw. Once a
witness has co-signed size 40, producing a different size-40 tree requires
forging that witness's signature too — not just CooL's.

CooL's own self-signature is shown on every tree head and **never** counted
as independent. The verifier has enforced that since v1; see
`sth.witnesses[].external` in the [receipt spec](receipt-format.md#inclusion-sth)
and the `witnesses` domain in the [verifier reference](verifier-reference.md#witnesses).

```bash
cool witness cosign --key auditor   # co-sign the current tree head
cool witness list                   # who has co-signed what is on disk
```

> [!IMPORTANT]
> Today's independent witness runs in its own Phala CVM, on a different node,
> with its own enclave-sealed key — and it refuses forged heads and replaced
> logs. But it runs under the same CooL account as the primary log. That proves
> key and process separation; it does not yet prove **organisational**
> independence. A witness operated by a separate organisation is a Gate 2 item
> — see [limits](limits.md) — and this is the single sentence in the
> [threat model](threat-model.md#still-in-the-trust-set) that matters most
> if you are deciding how much to rely on this log today.

## Anchoring to Bitcoin

Six of the seven verifier domains are, underneath, a signature — and a
signature says "someone holding this key asserts X." It does not say *when*.
Whoever holds a key can produce a signature at any time, including about a
past they would prefer, which is exactly the attack a transparency log
exists to rule out. A witness closes part of that gap by requiring a second
key. Anchoring closes the rest, without needing a second key at all.

A Bitcoin block header cannot be backdated. Commit a tree head's root hash
into one, and that root provably existed before the block was mined — no
matter who later obtains every signing key involved.

```bash
cool anchor submit            # send the current head to four public calendars — free, no key needed
cool anchor upgrade           # collect the Bitcoin block once the calendars aggregate it
cool anchor verify            # recompute the commitment and check it against the block header
cool anchor export head.ots   # write a proof anyone can check with the `ots` tool, no CooL code required
```

CooL uses [OpenTimestamps](https://opentimestamps.org/): the root hash goes
to four independently operated public calendars, which aggregate submissions
from everyone using them into a single Bitcoin transaction roughly once an
hour. The cost is nothing, and the output is a standard `.ots` file — see the
`anchor` field in the [receipt spec](receipt-format.md#anchor).

One submission covers every record in the log up to that tree size, because
the head commits to all of them; anchoring per record would be thousands of
transactions proving nothing extra.

Until `cool anchor upgrade` and `verify` complete against a real block, the
`anchor` domain reads `pending`, never `pass` — a receipt is never allowed to
claim a timestamp it has not actually received.

## Next

- [Threat model](threat-model.md) — the specific attacks witnesses and anchoring each close
- [Verifier reference](verifier-reference.md) — how `witnesses` and `anchor` fit into an overall `pass`
- [Limits](limits.md) — why today's witness proves process separation but not organisational independence
