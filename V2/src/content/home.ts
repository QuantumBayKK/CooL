/**
 * The landing page, as data.
 *
 * ── why this file exists ──
 *
 * The homepage is a long, dense, sectioned document rather than a scroll
 * trailer: a dozen bands, each making one checkable claim. Written inline that
 * is two thousand lines of JSX with the argument buried inside the markup, and
 * nobody can answer "what does the homepage actually claim?" without reading
 * all of it.
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

/**
 * The technical facts strip under the hero.
 *
 * Every entry is a named standard or a published artefact, so each one is a
 * search away from being confirmed. No adjectives, deliberately: this band is
 * where a sceptical engineer decides whether to keep reading, and adjectives
 * are what they are scanning for reasons to stop.
 */
export const PROOF_STRIP: readonly string[] = [
  "ML-DSA-65 · FIPS 204",
  "Ed25519 hybrid",
  "SHA-256 commitments",
  "Deterministic CBOR",
  "RFC 6962 log",
  "Apache-2.0",
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

/* ── 04 · what it gets you ────────────────────────────────────────────────── */

export const BENEFITS: readonly {
  readonly title: string;
  readonly body: string;
}[] = [
  {
    title: "Capture automatically",
    body: "The record is produced by the pipeline that made the change, not by an engineer remembering to write it down afterwards. Nobody opens a ticket, and nothing depends on anyone's discipline during a bad week.",
  },
  {
    title: "Verify independently",
    body: "Hand a receipt to a regulator, an auditor, a counterparty or a customer's own analyst. They check it on their machine, with the network off, using a verifier we neither host nor control.",
  },
  {
    title: "Prove for a decade",
    body: "Hybrid post-quantum signatures mean a record sealed today is still meaningful evidence once a cryptographically relevant quantum computer exists — which is the horizon a ten-year retention obligation actually spans.",
  },
];

/* ── 05 · position ────────────────────────────────────────────────────────── */

export interface Position {
  readonly n: string;
  readonly title: string;
  readonly body: string;
}

export const POSITIONS: readonly Position[] = [
  {
    n: "01",
    title: "Provider-neutral capture",
    body: "CooL instruments the choke points every AI system already has — CI, the gateway, the SDK — rather than one vendor's console. Swap one provider for another, or for a self-hosted model, and the evidence trail does not break.",
  },
  {
    n: "02",
    title: "Proof, not storage",
    body: "Keeping more logs does not help when the question is whether the logs were edited. CooL produces a small signed artefact whose integrity is checkable arithmetic, and leaves the bulk data where it already lives.",
  },
  {
    n: "03",
    title: "Post-quantum from day one",
    body: "Always hybrid, never post-quantum alone: ML-DSA-65 with Ed25519, ML-KEM with X25519. The new schemes are too young to bet uptime on, and hybrid means a break in either one is survivable.",
  },
  {
    n: "04",
    title: "Reuse what is already proven",
    body: "The transparency log is RFC 6962 — the structure behind Certificate Transparency and Sigstore. The policy engine and the durable workflows are off the shelf. A hand-rolled Merkle log is how you ship a subtle break nobody finds for two years.",
  },
  {
    n: "05",
    title: "Never in the critical path",
    body: "Capture is asynchronous and fails open, so CooL going down cannot take a customer's AI down with it. That removes the objection which kills infrastructure deals before the security review even starts.",
  },
  {
    n: "06",
    title: "Honesty enforced in code",
    body: "The verifier will not report a hardware pass without a hardware root. This site's CI fails the build if any page claims a readiness rung above the one we are on. Neither rule can be talked around by whoever is editing copy that week.",
  },
];

/* ── 06 · the landscape ───────────────────────────────────────────────────── */

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

/* ── 07 · market ──────────────────────────────────────────────────────────── */

/**
 * Transcribed from `src/content/deck.ts`, which is itself transcribed verbatim
 * from the pitch deck. Attribution travels with the figure: a market number
 * without its analyst is an assertion, and an investor who finds two different
 * numbers on two surfaces of the same company has a diligence problem we made
 * for them.
 */
export const MARKET: readonly {
  readonly k: string;
  readonly v: string;
  readonly note: string;
}[] = [
  {
    k: "TAM",
    v: "$15.8B",
    note: "AI-governance software by 2030 (Forrester) — around 7% of all AI software spend.",
  },
  {
    k: "SAM",
    v: "$3–5B",
    note: "The regulated audit and evidentiary slice: BFSI, health, government, legal.",
  },
  {
    k: "SOM",
    v: "$15–40M",
    note: "CooL's India-first capture over three to five years, via open-core conversion.",
  },
];

export const MARKET_FOOTNOTE =
  "These are third-party forecasts, not measured demand. The published analyst range for this category by 2030 runs from $1B (Gartner, platforms) to $15.8B (Forrester, governance software), and we print the source next to the figure so you can weigh it yourself. Gartner separately projects that AI regulation reaches 75% of world economies by 2030.";

/* ── 08 · standing ────────────────────────────────────────────────────────── */

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

/* ── 09 · founders ────────────────────────────────────────────────────────── */

export interface Founder {
  readonly name: string;
  readonly role: string;
  readonly city: string;
  readonly focus: string;
  readonly items: readonly string[];
  readonly github: string;
  readonly handle: string;
}

/**
 * Transcribed from the deck's team slide.
 *
 * Every line is a thing with a URL behind it — a repository, a published piece
 * of research, a named company. That is deliberate: this section sits two bands
 * below a table admitting the company holds no certifications, and the only
 * thing that makes the admission survivable is that everything else here can be
 * checked in a browser tab.
 */
export const FOUNDERS: readonly Founder[] = [
  {
    name: "Pranauv Shrinaath S",
    role: "Founder & CEO",
    city: "Chennai",
    focus: "Post-quantum cryptography and blockchain",
    items: [
      "ipsec-pqc-ikev2 — one of roughly 200 ML-KEM projects worldwide, mapping ML-KEM into IKEv2 against liboqs.",
      "Published research on decentralising public banks, secured with post-quantum cryptography and Hyperledger Fabric.",
      "Onsite research internship, NUS Singapore. Five years building, since 14.",
    ],
    github: "https://github.com/KenidoesCode",
    handle: "KenidoesCode",
  },
  {
    name: "Kailosh Kalimuthu",
    role: "Co-founder & CTO",
    city: "Bangalore",
    focus: "Trusted execution environments and AI inference",
    items: [
      "Built BIFROST — a decentralised peer-to-peer comms, storage and compute network that turns idle hardware into an encrypted distributed micro-cloud.",
      "Six months with the US startup Decipher.",
      "Three years building, since 16.",
    ],
    github: "https://github.com/Sk1zmo",
    handle: "Sk1zmo",
  },
];

export const FOUNDERS_NOTE =
  "Nothing here is claimed beyond what is listed, and every line is one click from being checked.";

/* ── 10 · roadmap ─────────────────────────────────────────────────────────── */

export interface Phase {
  readonly when: string;
  readonly title: string;
  readonly body: string;
  readonly state: "now" | "next" | "later";
}

/**
 * Four phases, aligned to the readiness ladder in `gates.ts` rather than to a
 * calendar. Dates on a pre-launch roadmap are fiction with a deadline attached;
 * rungs are checkable, and the ladder page publishes what each one requires.
 */
export const ROADMAP: readonly Phase[] = [
  {
    when: "Today",
    title: "Working demo, open verifier",
    body: "Real hybrid signatures, a real RFC 6962 log and a published offline verifier — running in your browser on this site, with the forgery controls included so you can watch it reject a tampered receipt.",
    state: "now",
  },
  {
    when: "Building now",
    title: "Hardware attestation and an independent witness",
    body: "Replace the simulated attestor with a real NVIDIA Confidential Compute or Intel TDX quote, then add witness co-signing and RFC 3161 timestamping so the log is no longer signed only by us.",
    state: "next",
  },
  {
    when: "Then",
    title: "Pilots with regulated-AI teams",
    body: "Design partners in RBI-regulated fintech and health-tech, single-tenant and on-prem deployments of the same artefact, an independent security review, and the certification groundwork a regulated buyer's procurement will ask for.",
    state: "later",
  },
  {
    when: "Where this goes",
    title: "The neutral evidentiary standard for regulated AI",
    body: "Self-attestation always gives way to cryptographic evidence — Certificate Transparency, Sigstore, RFC 3161. CooL brings that one-way migration to AI, and the format is open so it can outlive the company that wrote it.",
    state: "later",
  },
];
