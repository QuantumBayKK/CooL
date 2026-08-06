/**
 * The readiness ladder — the single source of truth for what this site is
 * allowed to say.
 *
 * CooL sells evidence. A company that oversells its own maturity has already
 * disproved its product, so the ladder is published rather than hidden, and the
 * claim sentence for each rung is stored as data rather than left to whoever is
 * editing copy that week.
 *
 * `scripts/verify-claims.mjs` reads `CURRENT_GATE` from this file and fails the
 * build if any page contains a phrase reserved for a rung above it. That is the
 * same mechanism the verifier uses to stop `simulated` rounding up to `pass`:
 * the rule lives in code, not in an instruction someone has to remember.
 *
 * Moving the site's claims up a rung is therefore a one-line change here — and
 * it will not pass CI until the evidence for that rung actually exists.
 */

export type GateStatus = "cleared" | "in-progress" | "not-started";

export interface GateItem {
  readonly label: string;
  readonly done: boolean;
  /** Why this item is on the list. Shown on hover/expand, never as filler. */
  readonly note?: string;
}

export interface GateGroup {
  readonly title: string;
  readonly items: readonly GateItem[];
}

export interface Gate {
  readonly id: string;
  readonly n: number;
  readonly name: string;
  readonly audience: string;
  readonly status: GateStatus;
  /** The exact sentence sales is allowed to say once this gate is fully green. */
  readonly claim: string;
  readonly groups: readonly GateGroup[];
}

/**
 * The rung the product is actually on today.
 *
 * Stage 0 is cleared; Gate 1 is the active work. Every public sentence on this
 * site must be supportable at Stage 0 — not Gate 1, because Gate 1 is not done.
 */
export const CURRENT_GATE = 0 as const;

/**
 * Phrases that may not appear in public copy at the current rung.
 *
 * Each entry names the gate that would license it. The scanner reports the gate,
 * so a failure tells you what you would have to finish rather than just telling
 * you off.
 *
 * These are matched case-insensitively as whole phrases against rendered page
 * text, so "SOC 2" fails but a link to a SOC 2 explainer in a threat model does
 * not — the scanner skips anything inside a `data-claim-exempt` block.
 */
export const RESERVED_CLAIMS: readonly { readonly phrase: string; readonly gate: number }[] = [
  // Marketing absolutes nothing on this ladder ever licenses.
  { phrase: "military-grade", gate: 99 },
  { phrase: "military grade", gate: 99 },
  { phrase: "bank-grade", gate: 99 },
  { phrase: "unhackable", gate: 99 },
  { phrase: "unbreakable", gate: 99 },
  { phrase: "100% secure", gate: 99 },
  { phrase: "fully secure", gate: 99 },
  { phrase: "zero risk", gate: 99 },

  // Gate 2 — security review, VPC/on-prem, real witnesses.
  { phrase: "security reviewed", gate: 2 },
  { phrase: "pen-tested", gate: 2 },
  { phrase: "pen tested", gate: 2 },
  { phrase: "penetration tested", gate: 2 },
  { phrase: "on-premise ready", gate: 2 },
  { phrase: "air-gapped install", gate: 2 },
  { phrase: "hsm-sealed", gate: 2 },
  { phrase: "sso ready", gate: 2 },

  // Gate 3 — certification and multi-tenant GA.
  { phrase: "soc 2 compliant", gate: 3 },
  { phrase: "soc2 compliant", gate: 3 },
  { phrase: "soc 2 certified", gate: 3 },
  { phrase: "iso 27001 certified", gate: 3 },
  { phrase: "hipaa compliant", gate: 3 },
  { phrase: "gdpr compliant", gate: 3 },
  { phrase: "enterprise-ready", gate: 3 },
  { phrase: "enterprise ready", gate: 3 },
  { phrase: "enterprise-grade", gate: 3 },
  { phrase: "enterprise grade", gate: 3 },
  { phrase: "generally available", gate: 3 },
  { phrase: "production-ready", gate: 3 },
  { phrase: "production ready", gate: 3 },
  { phrase: "battle-tested", gate: 3 },
  { phrase: "trusted by fortune 500", gate: 3 },
];

/** What the site may say today, verbatim. Rendered on the homepage hero. */
export const HONEST_CLAIM =
  "Run the demo, then verify every record yourself — offline, with a verifier we do not control.";

/**
 * `satisfies` rather than a `readonly Gate[]` annotation, so the array keeps its
 * tuple type. Under `noUncheckedIndexedAccess` an annotated array makes
 * `GATES[0]` possibly-undefined, and every consumer then needs a fallback for a
 * case that cannot happen — the ladder is a literal and it is never empty.
 */
export const GATES = [
  {
    id: "stage-0",
    n: 0,
    name: "Working demo",
    audience: "Anyone who wants to check the cryptography themselves.",
    status: "cleared",
    claim:
      "Here's a working demo — verify it yourself, offline.",
    groups: [
      {
        title: "What is real today",
        items: [
          {
            label: "Hash → hybrid-sign → transparency log → offline verifier",
            done: true,
            note: "ML-DSA-65 (FIPS 204) and Ed25519 over deterministic CBOR, appended to an RFC 6962 log.",
          },
          {
            label: "Tamper-evidence proven by attack, not by assertion",
            done: true,
            note: "The conformance run edits a byte and confirms the binding and signature domains both reject it.",
          },
          { label: "Policy engine and selective disclosure", done: true },
          { label: "Audit pack export", done: true },
          {
            label: "Verifier refuses under --require-hardware",
            done: true,
            note: "A receipt without a vendor-rooted quote is rejected outright, however many other domains pass.",
          },
        ],
      },
      {
        title: "What is not real today",
        items: [
          {
            label: "Hardware attestation is simulated",
            done: false,
            note: "No TDX in the loop yet. The attestation domain reports `simulated` and can never report `pass` — that rule is in the verifier, not in the copy.",
          },
          {
            label: "Public anchoring is absent",
            done: false,
            note: "The log is signed by our keys alone, which is not tamper-evident against us. Witnesses close this and they are not built.",
          },
          { label: "Capture is manual (CLI), not automatic", done: false },
          { label: "Single-node. No SSO, no on-prem, no certifications.", done: false },
        ],
      },
    ],
  },
  {
    id: "gate-1",
    n: 1,
    name: "Pilot-ready",
    audience:
      "A friendly technical team can run a scoped, non-production pilot in a sandbox.",
    status: "in-progress",
    claim:
      "Run a scoped pilot in your sandbox — and verify every record yourself, offline.",
    groups: [
      {
        title: "SDK behaviour under failure",
        items: [
          {
            label: "Fail-open proven with tests",
            done: false,
            note: "Capture must never block or break host inference. Dropped events are counted and written as a signed entry — loss is recorded, never silent.",
          },
          { label: "Kill switch", done: false },
          { label: "Windows Ctrl-C exits clean", done: false },
        ],
      },
      {
        title: "Supply chain",
        items: [
          { label: "npm audit = 0 on the SDK and verifier package", done: false },
          { label: "@anthropic-ai/sdk confirmed absent from the SDK tree", done: false },
        ],
      },
      {
        title: "Correctness",
        items: [
          {
            label: "redact ↔ verify integrity proven",
            done: false,
            note: "Redaction must work AND the log must still verify afterward — append-only cannot be broken by a privacy operation.",
          },
          { label: "Offline verifier identical on Windows, Linux and macOS", done: false },
          { label: "Receipt schema carries a version field", done: false },
        ],
      },
      {
        title: "Hardware",
        items: [
          {
            label: "Real attestation on Phala TDX",
            done: false,
            note: "Deploy to a real CVM so the two simulated domains flip to pass under a genuine Intel root via dcap-qvl — while receipts still label sim vs real honestly.",
          },
        ],
      },
      {
        title: "Integration",
        items: [
          {
            label: "Automatic capture from a real app in one language",
            done: false,
            note: "One reference integration — a CI hook or a gateway hook — not just a manual CLI seal.",
          },
          { label: "Install, config, verify-it-yourself docs and a draft threat model", done: false },
        ],
      },
    ],
  },
  {
    id: "gate-2",
    n: 2,
    name: "Security-review-ready",
    audience:
      "Survives an enterprise security questionnaire; deployable single-tenant in the customer's own VPC or on-prem.",
    status: "not-started",
    claim:
      "Pass your security review and deploy CooL single-tenant inside your own VPC — your data never leaves.",
    groups: [
      {
        title: "Deployment and data boundary",
        items: [
          { label: "Control-plane / data-plane split real and verified", done: false },
          { label: "Helm chart, K8s manifests, VPC and on-prem installs", done: false },
          {
            label: "Every outbound network call enumerated and disable-able",
            done: false,
            note: "One audited list; each call degrades gracefully so an air-gapped install still works.",
          },
        ],
      },
      {
        title: "Identity and access",
        items: [
          { label: "SAML 2.0 and OIDC, RBAC, MFA, separation of duties", done: false },
          { label: "Immutable audit log of CooL's own control plane", done: false },
        ],
      },
      {
        title: "Crypto and log integrity",
        items: [
          { label: "Signing keys HSM/TEE-sealed, never plaintext on disk", done: false },
          { label: "Known-answer tests against FIPS 203 and FIPS 204 in CI", done: false },
          {
            label: "Witnesses or public-chain anchoring live",
            done: false,
            note: "A log signed only by our own keys is not tamper-evident against us. This is the item that closes that hole, and no amount of hardware substitutes for it.",
          },
        ],
      },
      {
        title: "Assurance",
        items: [
          { label: "OWASP API Top-10 pass; SSRF, path traversal, TOCTOU closed", done: false },
          { label: "Third-party penetration test letter", done: false },
          { label: "Signed releases, SBOM, build provenance (Sigstore/SLSA)", done: false },
          { label: "HA, backup/restore and DR runbook where the restored log verifies", done: false },
          { label: "Load and soak tested with asserted SLOs", done: false },
        ],
      },
    ],
  },
  {
    id: "gate-3",
    n: 3,
    name: "Enterprise GA",
    audience:
      "A large organisation can standardise on it org-wide, multi-tenant and certified.",
    status: "not-started",
    claim:
      "Standardize on CooL org-wide as your system of record for AI change.",
    groups: [
      {
        title: "Certification",
        items: [
          { label: "SOC 2 Type II, ISO/IEC 27001, HIPAA + BAA, India DPDP mapping", done: false },
          { label: "Compliance-clause → evidence mapping in the product", done: false },
        ],
      },
      {
        title: "Multi-tenancy and scale",
        items: [
          {
            label: "Multi-tenant isolation proven",
            done: false,
            note: "Cross-tenant proof-forgery and cross-tenant key-use tests must pass. A cross-tenant leak in an evidence product is fatal.",
          },
          { label: "10^8+ log entries with proofs still O(log n)", done: false },
        ],
      },
      {
        title: "Operations",
        items: [
          { label: "SCIM provisioning, SIEM export, observability and runbooks", done: false },
          { label: "Air-gapped bundle, Terraform modules, rolling upgrade and safe rollback", done: false },
          { label: "Continuous fuzzing and crypto-correctness gates in CI", done: false },
          { label: "Support/SLA, pricing and licensing, GA docs", done: false },
        ],
      },
    ],
  },
] as const satisfies readonly Gate[];

/** The rung the site's claims are pinned to. Always defined — see the note above. */
export const CURRENT_STAGE: Gate =
  GATES.find((g) => g.n === CURRENT_GATE) ?? GATES[0];

/** The gate currently being worked toward. */
export const ACTIVE_GATE: Gate =
  GATES.find((g) => g.status === "in-progress") ?? GATES[0];

/** Progress within a gate, counted rather than estimated. */
export function gateProgress(gate: Gate): { done: number; total: number } {
  const items = gate.groups.flatMap((g) => g.items);
  return { done: items.filter((i) => i.done).length, total: items.length };
}
