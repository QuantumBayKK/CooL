/**
 * Content for the investors room.
 *
 * This page deliberately does NOT restate the deck. The deck argues the market,
 * the problem and the ask; anyone reading this page has already accepted those
 * and is asking a harder question: *can this team actually build it, and do
 * they know what they are doing?*
 *
 * So everything here is engineering judgement and operational honesty — the
 * architecture, what genuinely runs today versus what does not, what we refuse
 * to build ourselves, and exactly what the money converts into.
 */

export const HERO = {
  kicker: "Technical & operational diligence",
  title: "The part of the pitch that has to survive an engineer.",
  lead: "The deck makes the case. This is the working: how CooL is architected, what actually runs today, what we deliberately refuse to build, and precisely what ₹1 Cr turns into.",
} as const;

/* ── 1 · the principles everything else follows from ──────────────────── */

export interface Principle {
  readonly n: string;
  readonly title: string;
  readonly detail: string;
  readonly consequence: string;
}

export const PRINCIPLES: readonly Principle[] = [
  {
    n: "01",
    title: "Never sit in the critical path",
    detail:
      "Capture is asynchronous, out-of-band and fail-open. CooL adds zero latency to inference, and if CooL is down the customer's AI keeps serving.",
    consequence:
      "Removes the objection that kills infrastructure deals: “what happens when your thing breaks?”",
  },
  {
    n: "02",
    title: "Sensitive data stays in the customer's boundary",
    detail:
      "Control plane — orchestration, billing, updates — is ours. Data plane — evidence, prompts, PII — lives in their VPC or on-prem. The split is architectural, not a policy promise.",
    consequence:
      "This single decision is what makes CooL sellable to a regulated enterprise at all.",
  },
  {
    n: "03",
    title: "One artifact, three deployments",
    detail:
      "The same Kubernetes/Helm package runs as multi-tenant SaaS, single-tenant VPC, or fully air-gapped on-prem.",
    consequence:
      "We never fork the product per customer — the thing that quietly kills enterprise infrastructure startups.",
  },
  {
    n: "04",
    title: "Buy the hard proven parts",
    detail:
      "Transparency log, policy engine and durable workflows are battle-tested open source. We build only the layer that is genuinely ours.",
    consequence:
      "Engineering spend goes almost entirely into differentiated IP instead of re-solving solved problems.",
  },
  {
    n: "05",
    title: "Hybrid crypto, never post-quantum alone",
    detail:
      "Always classical and post-quantum together — ML-DSA-65 with Ed25519, ML-KEM with X25519.",
    consequence:
      "Post-quantum schemes are too young to bet uptime on. Hybrid means a break in either one is survivable.",
  },
];

/* ── 2 · the architecture, layer by layer ─────────────────────────────── */

export interface Layer {
  readonly zone: "Customer environment" | "CooL control plane";
  readonly name: string;
  readonly stack: string;
  readonly does: string;
}

export const LAYERS: readonly Layer[] = [
  {
    zone: "Customer environment",
    name: "Capture",
    stack:
      "TypeScript / Python SDKs · GitHub Actions, GitLab, Jenkins · LiteLLM / Portkey / Cloudflare AI Gateway · OpenTelemetry",
    does: "Instruments five choke points rather than two hundred frameworks. That is how the install stays under an hour.",
  },
  {
    zone: "Customer environment",
    name: "Ingestion",
    stack: "Rust · Redpanda / NATS JetStream",
    does: "Absorbs bursts on a durable queue so capture never blocks and nothing is lost under load.",
  },
  {
    zone: "Customer environment",
    name: "Evidence engine",
    stack: "Rust · BLAKE3 / SHA-256 · ML-DSA-65 + Ed25519",
    does: "Canonicalises, hashes and hybrid-signs every change. The trust-critical core, and the reason it is Rust.",
  },
  {
    zone: "Customer environment",
    name: "Transparency log",
    stack: "Google Trillian / Sigstore Rekor",
    does: "Append-only, signed tree heads, RFC 6962 lineage. Reused, never hand-rolled — a bespoke Merkle log is how you ship a subtle break.",
  },
  {
    zone: "Customer environment",
    name: "Stores",
    stack: "PostgreSQL · S3 / MinIO · ClickHouse · OpenSearch",
    does: "Right tool per job: lineage graph, evidence blobs, cost analytics, estate-wide search.",
  },
  {
    zone: "Customer environment",
    name: "Governance & automation",
    stack: "Open Policy Agent · Temporal · Jira / Confluence / ServiceNow / Slack / PagerDuty",
    does: "Decides what each change needs, then does it. This is where “nobody writes the documentation” actually happens.",
  },
  {
    zone: "Customer environment",
    name: "API & dashboard",
    stack: "GraphQL / REST · Next.js · OIDC / SAML SSO · SCIM · RBAC",
    does: "Search, lineage, reports, and a one-click verifiable audit export.",
  },
  {
    zone: "CooL control plane",
    name: "Orchestration",
    stack: "Managed · signed config, pulled by the data plane",
    does: "Fleet health, updates, licensing and billing. Carries no customer evidence or PII — by construction, not by policy.",
  },
];

/* ── 3 · the honest ledger ────────────────────────────────────────────── */

export interface StatusRow {
  readonly item: string;
  readonly state: "working" | "partial" | "planned";
  readonly note: string;
}

export const STATUS: readonly StatusRow[] = [
  {
    item: "Deterministic record format & canonicalisation",
    state: "working",
    note: "cool.receipt.v1, CDE CBOR, published spec with conformance vectors.",
  },
  {
    item: "Hybrid post-quantum signing",
    state: "working",
    note: "ML-DSA-65 + Ed25519, both required. Runs in the browser demo on this site.",
  },
  {
    item: "Tamper-evident transparency log",
    state: "working",
    note: "Real RFC 6962 Merkle tree, inclusion proofs and signed tree heads.",
  },
  {
    item: "Offline verifier",
    state: "working",
    note: "Published CLI. Anyone can check a receipt without contacting us.",
  },
  {
    item: "SDK & CI capture",
    state: "partial",
    note: "TypeScript SDK is public; CI plugins and gateway hooks are the next build.",
  },
  {
    item: "Governance automation & connectors",
    state: "partial",
    note: "Engines chosen (OPA, Temporal); connectors are simulated in the demo and labelled as such.",
  },
  {
    item: "Hardware attestation (TEE)",
    state: "planned",
    note: "Mocked today and reported as MOCK by the verifier — never as a pass. This round finishes it.",
  },
  {
    item: "External witnesses & public anchoring",
    state: "planned",
    note: "Reported as ABSENT. Offered only when a customer asks for it.",
  },
];

/* ── 4 · capital efficiency ───────────────────────────────────────────── */

export interface BuyBuild {
  readonly need: string;
  readonly choice: string;
  readonly verdict: "buy" | "build";
}

export const BUY_BUILD: readonly BuyBuild[] = [
  { need: "Transparency log", choice: "Trillian / Rekor", verdict: "buy" },
  { need: "Policy engine", choice: "Open Policy Agent", verdict: "buy" },
  { need: "Durable workflows", choice: "Temporal", verdict: "buy" },
  { need: "Observability", choice: "OpenTelemetry", verdict: "buy" },
  { need: "Gateway interception", choice: "LiteLLM / Portkey / Cloudflare", verdict: "buy" },
  { need: "Secrets & keys", choice: "Vault + cloud KMS / HSM", verdict: "buy" },
  { need: "Search & analytics", choice: "OpenSearch · ClickHouse", verdict: "buy" },
  { need: "AI-change semantics", choice: "Ours", verdict: "build" },
  { need: "Evidence-binding engine", choice: "Ours", verdict: "build" },
  { need: "Governance automation layer", choice: "Ours", verdict: "build" },
];

/* ── 5 · how it reaches enterprise ────────────────────────────────────── */

export interface Topology {
  readonly name: string;
  readonly who: string;
  readonly how: string;
}

export const TOPOLOGIES: readonly Topology[] = [
  {
    name: "Multi-tenant SaaS",
    who: "SMB and mid-market who want to start today",
    how: "Managed control and data plane, with per-tenant cryptographic isolation.",
  },
  {
    name: "Single-tenant VPC (BYOC)",
    who: "Most enterprises",
    how: "Data plane runs in the customer's own cloud; we manage the control plane. Their data never leaves.",
  },
  {
    name: "On-prem / air-gapped",
    who: "Defence, government, top-tier finance",
    how: "Full stack via Helm, with zero outbound calls.",
  },
];

/* ── 6 · what the money buys, immediately ─────────────────────────────── */

export const MVP_SLICE: readonly string[] = [
  "One SDK (TypeScript) and one CI integration (GitHub Actions), capturing prompt, model and config changes.",
  "Evidence core: hash → hybrid-sign → append to Trillian/Rekor. Reused, not rebuilt.",
  "PostgreSQL lineage plus the dashboard screen: every AI change, searchable and provable.",
  "Two outbound connectors — Jira and Slack — proving nobody writes documentation by hand.",
  "The offline verifier, so anyone can check a record's integrity without trusting us.",
  "Hybrid signatures from day one; the TEE attestation de-mocked as the tier lands.",
];

export const TERMS = {
  amount: "₹1 Crore",
  instrument: "SAFE",
  cap: "₹10 Cr post-money cap",
  runway: "12 months",
  entity: "Northwind Cipher Pvt. Ltd.",
} as const;

export const CLOSING =
  "CooL today is an honest system: the cryptography is real and public, and the attestation tier is mocked and says so. This round turns a proven core into a product a regulated enterprise runs every day.";
