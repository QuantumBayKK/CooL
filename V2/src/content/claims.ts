/**
 * The claim registry.
 *
 * Every quantitative or technical statement the film-led site makes is listed
 * here with where it comes from, what state it is in, when it was last
 * checked, and the exact wording we are permitted to publish. Pages render
 * from `CLAIMS[id].wording` rather than retyping a claim, so raising or
 * lowering a claim is one edit here and nowhere else.
 *
 * Status vocabulary (shared with the verifier UI):
 *   REAL        — evidenced by a published artefact or by code in this repo
 *   SIMULATED   — produced by the simulator / mock attestor, labelled as such
 *   ABSENT      — does not exist yet; the verifier reports it as absent
 *   PLANNED     — committed direction, not built
 *   UNVERIFIED  — stated somewhere but not checkable from evidence we hold
 *
 * `tests/film-claims.test.ts` fails CI if an entry lacks a source or a date,
 * or if an UNVERIFIED claim is marked publishable.
 */

export type ClaimStatus = "REAL" | "SIMULATED" | "ABSENT" | "PLANNED" | "UNVERIFIED";

export interface Claim {
  readonly status: ClaimStatus;
  /** Repo path, URL, or artefact the claim is checked against. */
  readonly source: string;
  /** ISO date the source was last read. */
  readonly checked: string;
  /** The only wording the site may use for this claim. */
  readonly wording: string;
  /** False keeps the claim out of every page; it stays here as a record. */
  readonly publish: boolean;
  readonly note?: string;
}

const MATRIX =
  "https://github.com/Northwind-Cipher/cool-sdk/blob/main/artifacts/closure-verification-matrix.md";
const NPM = "https://registry.npmjs.org/cool-nwc/3.0.0";
const README = "https://unpkg.com/cool-nwc@3.0.0/README.md";
const SECURITY = "https://github.com/Northwind-Cipher/cool-sdk/blob/main/SECURITY.md";
const CHECKED = "2026-10-20";

export const CLAIMS = {
  domainsSeven: {
    status: "REAL",
    source: MATRIX,
    checked: CHECKED,
    wording:
      "Seven verification domains — binding, signature, inclusion, consistency, witness, attestation, enclave — each verified on Intel TDX hardware on Phala Cloud.",
    publish: true,
  },
  anchorAbsent: {
    status: "ABSENT",
    source: MATRIX,
    checked: CHECKED,
    wording:
      "Public-chain anchoring is not proven. The SDK ships an OpenTimestamps anchor; Bitcoin confirmation is experimental, and the hardware run's verdict reports anchor ABSENT.",
    publish: true,
  },
  tamperMatrix: {
    status: "REAL",
    source: MATRIX,
    checked: CHECKED,
    wording:
      "An 11-row tamper matrix: every single-field change fails verification on the expected domain.",
    publish: true,
  },
  workloadChange: {
    status: "REAL",
    source: MATRIX,
    checked: CHECKED,
    wording:
      "A changed workload changes RTMR3 and is rejected against the original pin; MRTD and RTMR0–2 stay identical.",
    publish: true,
  },
  consistencyPairs: {
    status: "REAL",
    source: MATRIX,
    checked: CHECKED,
    wording: "36 of 36 consistency pairs verify against enclave-signed heads.",
    publish: true,
  },
  fixtureTests: {
    status: "REAL",
    source: MATRIX,
    checked: CHECKED,
    wording: "119 of 119 SDK fixture tests pass, 0 skipped. They prove software behaviour, not silicon.",
    publish: true,
  },
  cpuOnly: {
    status: "REAL",
    source: MATRIX,
    checked: CHECKED,
    wording: "CPU Intel TDX only. No GPU attestation is claimed.",
    publish: true,
  },
  devImage: {
    status: "REAL",
    source: MATRIX,
    checked: CHECKED,
    wording: "The hardware runs used a development OS image (is_dev: true).",
    publish: true,
  },
  quoteFreshness: {
    status: "ABSENT",
    source: MATRIX,
    checked: CHECKED,
    wording: "There is no quote-freshness check. CooL records tcb_status as “Unknown”.",
    publish: true,
  },
  onlineAttestation: {
    status: "REAL",
    source: MATRIX,
    checked: CHECKED,
    wording:
      "Attestation verification is online through Phala's service; the local dcap-qvl check relies on collateral archived from Phala.",
    publish: true,
  },
  witnessSameAccount: {
    status: "REAL",
    source: MATRIX,
    checked: CHECKED,
    wording:
      "The witness ran in a separate CVM, node and key, deployed from the same Phala account. Operation by a different organisation is not demonstrated.",
    publish: true,
  },
  externalWitness: {
    status: "PLANNED",
    source: README,
    checked: CHECKED,
    wording: "External transparency witnesses and gossip are planned.",
    publish: true,
  },
  gpuAttestation: {
    status: "PLANNED",
    source: README,
    checked: CHECKED,
    wording: "NVIDIA confidential-GPU verification is planned.",
    publish: true,
  },
  manifestUnsigned: {
    status: "REAL",
    source: MATRIX,
    checked: CHECKED,
    wording: "The evidence manifest for the hardware runs is unsigned.",
    publish: true,
  },
  hybridSignature: {
    status: "REAL",
    source: README,
    checked: CHECKED,
    wording: "Hybrid ML-DSA-65 (FIPS 204) + Ed25519. Both signatures must verify.",
    publish: true,
  },
  rfc6962: {
    status: "REAL",
    source: README,
    checked: CHECKED,
    wording: "RFC 6962 Merkle transparency log with signed tree heads, inclusion and consistency proofs.",
    publish: true,
  },
  saltedCommitments: {
    status: "REAL",
    source: README,
    checked: CHECKED,
    wording: "Metadata and payloads are committed as salted hashes and discarded. The receipt carries no plaintext.",
    publish: true,
  },
  noTelemetry: {
    status: "REAL",
    source: "https://unpkg.com/cool-nwc@3.0.0/dist/index.d.ts",
    checked: CHECKED,
    wording: "The SDK makes no network calls of its own and carries no telemetry.",
    publish: true,
  },
  noInstallScripts: {
    status: "REAL",
    source: README,
    checked: CHECKED,
    wording: "No native build step, no postinstall scripts, no network calls at install.",
    publish: true,
  },
  runtimeDeps: {
    status: "REAL",
    source: NPM,
    checked: CHECKED,
    wording: "Five runtime dependencies: @noble/curves, @noble/hashes, @noble/post-quantum, cbor2, ulid.",
    publish: true,
  },
  packageVersion: {
    status: "REAL",
    source: NPM,
    checked: CHECKED,
    wording: "cool-nwc 3.0.0 on npm. Node 20 or later.",
    publish: true,
  },
  licence: {
    status: "REAL",
    source: "https://github.com/Northwind-Cipher/cool-sdk/blob/main/LICENSE",
    checked: CHECKED,
    wording:
      "Source-available under the Business Source License 1.1. cool-nwc 3.0.0 and earlier were published under Apache-2.0.",
    publish: true,
    note: "Never say “open source” for the current line: BUSL-1.1 is not an OSI licence.",
  },
  simulatorLabel: {
    status: "SIMULATED",
    source: README,
    checked: CHECKED,
    wording:
      "Without hardware the SDK runs a simulator. Every such receipt is labelled simulated, and the verifier never reports it as a pass.",
    publish: true,
  },
  browserVerifier: {
    status: "REAL",
    source: "src/lib/cool/verify.ts",
    checked: CHECKED,
    wording:
      "The verifier on /verify is the real cool.receipt.v1 verifier, running in your browser against published conformance vectors.",
    publish: true,
  },
  browserAttestationMock: {
    status: "SIMULATED",
    source: "public/cool-vectors/valid-receipt.json",
    checked: CHECKED,
    wording:
      "The conformance vectors were sealed without hardware, so in the browser attestation reports MOCK and anchor and witnesses report ABSENT.",
    publish: true,
  },
  nvidiaInception: {
    status: "REAL",
    source: "public/index.html (prior signed-off site copy)",
    checked: CHECKED,
    wording: "Northwind Cipher is a member of the NVIDIA Inception Program.",
    publish: true,
  },
  phalaInfra: {
    status: "REAL",
    source: MATRIX,
    checked: CHECKED,
    wording: "CooL's hardware runs used Phala Cloud Intel TDX confidential VMs through dstack.",
    publish: true,
    note: "Infrastructure use, not an endorsement — the matrix itself disclaims Phala endorsement.",
  },
  edgeless: {
    status: "PLANNED",
    source: "public/index.html (prior signed-off site copy)",
    checked: CHECKED,
    wording: "Working towards a collaboration with Edgeless Systems.",
    publish: true,
  },
  certifications: {
    status: "ABSENT",
    source: SECURITY,
    checked: CHECKED,
    wording: "No SOC 2, ISO 27001 or HIPAA certification is held.",
    publish: true,
  },
  customers: {
    status: "ABSENT",
    source: "public/index.html (prior signed-off site copy)",
    checked: CHECKED,
    wording: "No paying customers yet. Design-partner pilots are the next step.",
    publish: true,
  },
  billing: {
    status: "ABSENT",
    source: "public/pricing.html (prior signed-off site copy)",
    checked: CHECKED,
    wording: "Billing is not live. Prices are launch prices; no one is paying them today.",
    publish: true,
  },
  externalAudit: {
    status: "ABSENT",
    source: SECURITY,
    checked: CHECKED,
    wording: "No independent security audit has been completed.",
    publish: true,
  },
  disclosure: {
    status: "REAL",
    source: SECURITY,
    checked: CHECKED,
    wording:
      "Report vulnerabilities through GitHub private vulnerability reporting on cool-sdk. Acknowledgement within 3 working days; fix or mitigation plan within 30 days.",
    publish: true,
  },
  notCorrectness: {
    status: "REAL",
    source: README,
    checked: CHECKED,
    wording: "CooL records what happened. It does not prove the output was correct, fair, safe or compliant.",
    publish: true,
  },
  uptime: {
    status: "UNVERIFIED",
    source: "none",
    checked: CHECKED,
    wording: "",
    publish: false,
    note: "No uptime, latency or user-count figures exist. Do not publish any.",
  },
} as const satisfies Record<string, Claim>;

export type ClaimId = keyof typeof CLAIMS;

export function claim(id: ClaimId): string {
  return CLAIMS[id].wording;
}

export const EVIDENCE_URL = MATRIX;
export const REPO_URL = "https://github.com/Northwind-Cipher/cool-sdk";
export const NPM_URL = "https://www.npmjs.com/package/cool-nwc";
export const BOOKING_URL = "https://cal.com/coolnwc";
