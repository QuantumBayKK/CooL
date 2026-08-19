/**
 * The landing page, as data.
 *
 * ── why this file exists ──
 *
 * The homepage is a sectioned document rather than a scroll trailer: five
 * bands plus the demo, each making one checkable claim. Written inline that is
 * a thousand lines of JSX with the argument buried inside the markup, and
 * nobody can answer "what does the homepage actually claim?" without reading
 * all of it.
 *
 * It was fifteen bands. The market figures, the roadmap, the founders and the
 * worked example were cut rather than shortened — they are investor material
 * and restatement, they still live in `deck.ts` and on `/about`, and a landing
 * page that makes its argument in five bands makes it better than one that
 * makes it in fifteen. See the note at the top of `components/home/sections.tsx`
 * for what went and why.
 *
 * Kept here, the claims are a list you can audit in one sitting — which is the
 * only way `scripts/verify-claims.mjs` and a human reviewer can both do their
 * job. Several figures also appear on `/security`, `/about` and in the deck;
 * where that is true the note on the entry says which file is upstream, so a
 * correction lands in one place instead of three.
 *
 * ── the rule every number here lives under ──
 *
 * Nothing in this file may claim a rung above `CURRENT_GATE` in `gates.ts`, and
 * nothing may state a figure the reader cannot trace. Market numbers carry their
 * analyst source. Domain statuses are transcribed from `/security`, which is
 * itself transcribed from what the verifier actually returns. The comparison
 * matrix marks CooL "partial" in the one row where CooL is partial, because a
 * matrix where the author's own column is solid green is a matrix nobody reads.
 */

/* ── hero ─────────────────────────────────────────────────────────────────── */

/**
 * The three numbers under the headline.
 *
 * Chosen because each one is checkable in under a minute: count the rows in the
 * domain table, count the ones marked real, and watch the network panel during
 * a verify. A stat rail reading "10,000+ receipts sealed" would be far more
 * impressive and would be the first thing a sceptic tried to verify and could
 * not.
 */
export const HERO_STATS: readonly {
  readonly k: string;
  readonly v: string;
  readonly note: string;
}[] = [
  {
    k: "7",
    v: "verification domains",
    note: "Checked and reported separately — never averaged into one green tick.",
  },
  {
    k: "5",
    v: "real today",
    note: "Attestation is simulated and witnessing is absent. Both are named below.",
  },
  {
    k: "0",
    v: "network calls to verify",
    note: "The verifier runs offline, on your machine, with no account.",
  },
];

/* ── 01 · why now ─────────────────────────────────────────────────────────── */

export interface Driver {
  readonly ref: string;
  readonly jurisdiction: string;
  readonly what: string;
}

/**
 * The regulatory drivers, cited rather than summarised.
 *
 * `ref` is the instrument and the article, because "regulators are getting
 * serious about AI" is a sentence any vendor can type and none can support. A
 * compliance reader recognises SR 11-7 on sight and can check Article 12 in
 * ninety seconds; that is the difference between a claim and a citation.
 */
export const DRIVERS: readonly Driver[] = [
  {
    ref: "EU AI Act, Article 12",
    jurisdiction: "European Union",
    what: "High-risk AI systems must technically allow the automatic recording of events across the system's lifetime.",
  },
  {
    ref: "DPDP Rules, 2025",
    jurisdiction: "India",
    what: "Continuous logging, defined retention and audit obligations for personal data held by significant data fiduciaries.",
  },
  {
    ref: "SR 11-7",
    jurisdiction: "United States",
    what: "Model-risk supervision expects documented lineage: which model version was in use, approved by whom, and when it changed.",
  },
  {
    ref: "RBI model governance",
    jurisdiction: "India · BFSI",
    what: "Draft AI/ML norms push regulated lenders toward demonstrable governance over the models that make credit decisions.",
  },
];

/**
 * The gap the drivers do not close — and the reason the product exists.
 *
 * Stated as a limitation of the regulation rather than as a boast, because it
 * is one. Every framework above mandates records. None of them yet mandates
 * that the records be unforgeable by the party keeping them, which is exactly
 * the party a regulator ends up investigating.
 */
export const DRIVER_GAP =
  "Every one of these mandates records and logs. None of them yet mandates that those records be cryptographically tamper-evident — so the evidence that decides an investigation still sits on servers owned by the party under investigation, in a format they could have rewritten.";

/* ── 02 · the product ─────────────────────────────────────────────────────── */

export interface Pillar {
  readonly n: string;
  readonly name: string;
  readonly title: string;
  readonly body: string;
  readonly code: string;
  readonly lang: string;
  readonly href: string;
  readonly linkLabel: string;
}

export const PILLARS: readonly Pillar[] = [
  {
    n: "01",
    name: "Capture",
    title: "Every AI change, recorded as it ships.",
    body: "A prompt edit, a model or version swap, a temperature change, a tool grant. Capture is out-of-band, asynchronous and fail-open — it never sits in the request path of a model call and adds no latency to inference. If CooL is unreachable your AI keeps serving.",
    code: "npm install cool-nwc",
    lang: "bash",
    href: "/docs/quickstart",
    linkLabel: "Read the quickstart",
  },
  {
    n: "02",
    name: "Seal",
    title: "Canonicalised, committed, signed twice.",
    body: "The record is serialised as deterministic CBOR, committed with a SHA-256 binding hash, then signed with ML-DSA-65 and Ed25519 together. Both are required, so a forger has to break a post-quantum scheme and a classical one — and hybrid means a break in either is survivable.",
    code: "await cool.seal(change)",
    lang: "ts",
    href: "/technology",
    linkLabel: "How the pipeline works",
  },
  {
    n: "03",
    name: "Verify",
    title: "Checked by anyone, offline, without us.",
    body: "The receipt is committed to an append-only RFC 6962 transparency log, so its position in history is provable rather than asserted. The verifier is published, runs with the network off, needs no account, and will reject a record we produced if that record is wrong.",
    code: "cool verify receipt.json",
    lang: "bash",
    href: "/demo",
    linkLabel: "Run it in your browser",
  },
];

/* ── 03 · the seven domains ───────────────────────────────────────────────── */

export interface Domain {
  readonly name: string;
  readonly verdict: "real" | "simulated" | "absent";
  readonly what: string;
  readonly how: string;
}

/**
 * Transcribed from `/security`, which is the upstream copy for this table.
 *
 * Five real, one simulated, one absent — and the two that do not pass sit in
 * the same table as the five that do, in reading order, not in a footnote. A
 * verdict grid whose author quietly omitted his own failures would be arguing
 * against the product's entire thesis on the product's own homepage.
 */
export const DOMAINS: readonly Domain[] = [
  {
    name: "canonical",
    verdict: "real",
    what: "The record serialises deterministically.",
    how: "Re-encodes the core as CDE CBOR and compares bytes. Two implementations must agree exactly, or the digest below means nothing.",
  },
  {
    name: "binding",
    verdict: "real",
    what: "The digest matches the record.",
    how: "SHA-256 over the canonical bytes. Alter one byte of the record and this fails.",
  },
  {
    name: "signature",
    verdict: "real",
    what: "The record was signed by the pinned key.",
    how: "ML-DSA-65 (FIPS 204) and Ed25519, both required. A forger needs to break both, and one of them is post-quantum.",
  },
  {
    name: "inclusion",
    verdict: "real",
    what: "The record is in the log at the position claimed.",
    how: "RFC 6962 audit path recomputed to the signed tree head.",
  },
  {
    name: "consistency",
    verdict: "real",
    what: "The log only ever grew.",
    how: "Consistency proof between two tree heads. Catches a log that dropped or rewrote history between observations.",
  },
  {
    name: "attestation",
    verdict: "simulated",
    what: "Where the record was produced.",
    how: "No TDX in the loop yet, so this domain reports simulated and can never report pass. The rule is in the verifier — nothing in any UI can reach it.",
  },
  {
    name: "witnesses",
    verdict: "absent",
    what: "An independent party saw the same log.",
    how: "Not built. A log signed only by our keys is not tamper-evident against us, and no amount of hardware substitutes for a second signer.",
  },
];

/* ── 04 · the landscape ───────────────────────────────────────────────────── */

export type Mark = "yes" | "partial" | "no";

export interface LandscapeRow {
  readonly capability: string;
  readonly marks: readonly Mark[];
  readonly cool: Mark;
  /** Rendered under the table when CooL's own mark is anything but `yes`. */
  readonly caveat?: string;
}

export const LANDSCAPE_COLUMNS: readonly {
  readonly label: string;
  readonly examples: string;
}[] = [
  { label: "AI observability", examples: "Langfuse · Datadog" },
  { label: "Governance & GRC", examples: "Credo AI · OneTrust" },
  { label: "Compliance automation", examples: "Vanta · Drata" },
  { label: "Build in-house", examples: "Your own team" },
];

/**
 * The comparison matrix.
 *
 * Two rules keep this from being the usual vendor cartoon. Adjacent categories
 * are scored on what they are genuinely good at rather than strawmanned —
 * observability really does capture every call, GRC really does hold the policy
 * record — and CooL's own column carries a `partial` with the reason attached.
 * The row where CooL is weakest is the row a technical buyer checks first, so
 * it is better to write it down than to be caught having left it out.
 *
 * `marks` is positional against `LANDSCAPE_COLUMNS`. That coupling is checked
 * at render time rather than left to hold by luck — see `Landscape` in
 * `components/home/sections.tsx`.
 */
export const LANDSCAPE: readonly LandscapeRow[] = [
  {
    capability: "Captures every AI change automatically",
    marks: ["yes", "no", "no", "partial"],
    cool: "yes",
  },
  {
    capability: "Evidence is tamper-evident, not merely stored",
    marks: ["no", "no", "no", "no"],
    cool: "yes",
  },
  {
    capability: "Neutral across every model provider",
    marks: ["partial", "yes", "yes", "partial"],
    cool: "yes",
  },
  {
    capability: "Checkable with no account and no network",
    marks: ["no", "no", "no", "no"],
    cool: "yes",
  },
  {
    capability: "Proves which model actually ran on the hardware",
    marks: ["no", "no", "no", "no"],
    cool: "partial",
    caveat:
      "Partial, and it stays partial until hardware attestation is real. The record binds the model identity the customer's own pipeline reports; binding it to a vendor-rooted TEE quote is the next build, and the verifier reports that domain as simulated until it lands.",
  },
  {
    capability: "Signatures built to outlast the retention period",
    marks: ["no", "no", "no", "no"],
    cool: "yes",
  },
];

/* ── 05 · standing ────────────────────────────────────────────────────────── */

/**
 * What the company does not have yet, on the homepage rather than in a footer.
 *
 * The block that renders this is wrapped in `claim-exempt` markers, because
 * naming a certification in order to say we do not hold it is the one case the
 * claim scanner has to allow. The exemption covers the naming, not the claiming
 * — every sentence here is negative, and it has to stay that way.
 */
export const STANDING: readonly {
  readonly label: string;
  readonly value: string;
}[] = [
  {
    label: "Certifications",
    value:
      "None held. No SOC 2 report, no ISO 27001 certificate, no HIPAA attestation. The groundwork is scoped; nothing has been audited.",
  },
  {
    label: "Independent security review",
    value:
      "Not commissioned yet. The cryptography is public and the verifier is published, so anyone is free to review it in the meantime.",
  },
  {
    label: "Customers",
    value:
      "None. CooL is pre-launch, and there are no testimonials on this site because there is nobody yet who could honestly give one.",
  },
  {
    label: "Pricing",
    value:
      "Not live. The SDK, the receipt format and the verifier are Apache-2.0 and free; commercial terms around the managed log are not published yet.",
  },
];
