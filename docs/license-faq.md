# Licence FAQ

*What is Apache-2.0, what is not, and where each boundary actually sits.*

This page states what the licence files in each repository actually say. It
is not legal advice — read the `LICENSE` file in the package you are using.

## Is the SDK/CLI open source?

Yes. `cool-nwc` and its alias `cool-tee` — the library and the `cool` CLI
built from it — are **Apache License 2.0**, published on npm and at
[github.com/KenidoesCode/cool-sdk](https://github.com/KenidoesCode/cool-sdk).
That covers the evidence engine, the offline verifier, the receipt schema,
and everything documented on this site under
[CLI reference](cli-reference.md) and [receipt spec](receipt-format.md).

```bash
npm view cool-nwc license   # Apache-2.0
npm view cool-tee license   # Apache-2.0
```

## Can I run my own verifier, or fork the SDK?

Yes. That is what "offline, with a verifier we do not control" in the
[quickstart](quickstart.md) means in practice — Apache-2.0 permits use,
modification, and redistribution, with attribution and the licence's patent
grant intact. If you build a second, independent implementation of
`cool.receipt.v2` from the published schema and conformance vectors, nothing
here requires it to come back to this project.

## Is the website or the investor portal open source?

No. The code behind this site — the marketing pages, the `/verify` and
`/pipeline` evidence surfaces, the console, and the investor portal — is a
separate, private repository with no licence granted for reuse. It is not
published for redistribution, and nothing on this page extends the SDK's
Apache-2.0 terms to it.

## What about the receipt format itself?

The schema is documentation, not code — it is published as part of the
Apache-licensed SDK's source and this site's docs so that independent
verifiers can be built against it. Implementing a verifier for
`cool.receipt.v2` does not require accepting any licence beyond what applies
to whichever published source you copy from (the SDK's Apache-2.0 terms, if
you copy from it).

## Who holds the copyright?

The SDK packages list **Northwind Cipher Pvt. Ltd.** as author. Confirm the
current holder and any contribution terms in the `LICENSE` file shipped with
the package you installed — `npm pack cool-nwc` and read `LICENSE` inside it
if you want it in hand before agreeing to anything.
