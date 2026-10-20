/**
 * Editable copy for the film-led site.
 *
 * Prose lives here so a wording change is not a component change. Anything
 * technical or quantitative is pulled from `claims.ts` instead of being
 * retyped, so the two cannot drift.
 */

import { claim } from "./claims";

export const HERO = {
  kicker: "[ CooL · the flight recorder for AI change ]",
  line1: "Proof of what your AI did.",
  line2: "Not a promise.",
  support: "Signed, verifiable receipts for AI changes.",
  install: "npm i -g cool-nwc",
} as const;

export const STATEMENT = {
  label: "[ 01 · Statement ]",
  title: "When an AI system changes, someone will ask what changed.",
  body: "A prompt is edited, a model is swapped, a tool is granted. CooL seals each change the moment it ships — committed, hybrid-signed, appended to a transparency log — so the answer later is a receipt anyone can check, not a recollection someone has to trust.",
} as const;

export const QUESTIONS: readonly { q: string; a: string }[] = [
  { q: "Which prompt was live on the 14th?", a: "The receipt names it by commitment, under a signed tree head." },
  { q: "Was the record edited after the incident?", a: "Edit one byte and binding and signature fail." },
  { q: "Did anything get dropped from the log?", a: "Consistency proofs show the log only ever grew." },
  { q: "Where was it produced?", a: "On hardware, an Intel TDX quote binds the enclave to the signing key." },
];

export const PRODUCTS = [
  {
    id: "receipts",
    index: "R-01",
    name: "Receipts",
    href: "/developers#receipt",
    body: "One JSON file per change. Salted commitments, never plaintext. Greppable, attachable to a ticket.",
  },
  {
    id: "verifier",
    index: "V-02",
    name: "Verifier",
    href: "/verify",
    body: "Offline. No account, no network, no trust in us. Exits non-zero on any failure, so CI can gate on it.",
  },
  {
    id: "attestation",
    index: "A-03",
    name: "Attestation",
    href: "/evidence#attestation",
    body: "On Intel TDX, the quote binds the measured enclave to the key that signed the record.",
  },
  {
    id: "log",
    index: "L-04",
    name: "Log",
    href: "/evidence#log",
    body: "An RFC 6962 Merkle log. Tampering is not prevented by access control — it is made detectable by anyone.",
  },
] as const;

export const RECORDER_STEPS = [
  { at: 0, label: "[ A · 01 ]", title: "Something changed.", body: "A model, a prompt, a policy, a permission." },
  { at: 0.3, label: "[ A · 02 ]", title: "It was recorded as it shipped.", body: "Not written up afterwards. Captured at the moment of change." },
  { at: 0.58, label: "[ A · 03 ]", title: "Sealed into a receipt.", body: "Committed, signed with ML-DSA-65 and Ed25519, appended to the log." },
  { at: 0.82, label: "[ A · 04 ]", title: "Checkable by anyone.", body: "The recorder is ours. The verdict is yours." },
] as const;

export type StageStatus = "REAL" | "SIMULATED";

export const PIPELINE: readonly {
  id: string;
  name: string;
  body: string;
  status: StageStatus;
  note: string;
}[] = [
  { id: "capture", name: "Capture", body: "cool.record() or the CLI captures the change as it ships.", status: "REAL", note: "SDK 3.0.0" },
  { id: "canonicalise", name: "Canonicalise", body: "Deterministic CBOR. One logical value, one byte string.", status: "REAL", note: "cbor2" },
  { id: "bind", name: "Bind", body: "Salted SHA-256 commitments; the binding hash covers the whole record.", status: "REAL", note: "binding domain" },
  { id: "sign", name: "Sign", body: "ML-DSA-65 and Ed25519 over the binding. Both must verify.", status: "REAL", note: "signature domain" },
  { id: "log", name: "Log", body: "Appended to an RFC 6962 tree under a signed tree head.", status: "REAL", note: "inclusion · consistency" },
  { id: "verify", name: "Verify", body: "Seven domains checked independently, offline.", status: "REAL", note: "cool verify" },
];

export const PIPELINE_NOTE = claim("simulatorLabel");

export const COMPARISON = {
  label: "[ 05 · Comparison ]",
  title: "A log you keep, or a receipt anyone can check.",
  rows: [
    ["Who can check it", "Whoever has database access", "Anyone with the file and the open verifier"],
    ["After an edit", "Looks the same", "Binding and signature fail"],
    ["After a deletion", "Gap is invisible", "Consistency proof fails"],
    ["Where it was made", "Unstated", "Intel TDX quote, when run on hardware"],
    ["Trust required in the vendor", "All of it", "None — verify offline"],
  ] as const,
};

export const AUDIENCES = [
  {
    index: "[ ENG ]",
    who: "Engineering",
    body: "One call or one CLI command in the release path. Receipts are a side effect of shipping, not a task after it.",
  },
  {
    index: "[ RISK ]",
    who: "Risk & compliance",
    body: "Evidence produced continuously instead of assembled by hand. An audit becomes an export.",
  },
  {
    index: "[ AUDIT ]",
    who: "Auditors",
    body: "A verifier that runs on your machine, with the network off. You never have to take our word for it.",
  },
] as const;

/** Dated updates. Every date is a git commit or npm publish date. */
export const UPDATES: readonly { date: string; title: string; source: string }[] = [
  {
    date: "2026-10-11",
    title: "Attestation and enclave verified on Phala Cloud Intel TDX — evidence matrix published.",
    source: "git · cool-sdk artifacts/closure-verification-matrix.md",
  },
  { date: "2026-09-11", title: "cool-nwc 3.0.0 published to npm.", source: "registry.npmjs.org/cool-nwc" },
  { date: "2026-08-27", title: "The CooL Recorder studio goes live at /studio.", source: "git" },
  {
    date: "2026-08-04",
    title: "Tree heads anchored with OpenTimestamps; Bitcoin confirmation marked experimental.",
    source: "git · cool-nwc README roadmap",
  },
  { date: "2026-08-04", title: "cool-nwc first published to npm (2.1.0).", source: "registry.npmjs.org/cool-nwc" },
];

export const FINAL = {
  title: "Run the verifier. Then try to break it.",
  body: "Everything on this site that can be checked, can be checked by you.",
} as const;

/**
 * Founder content — reused verbatim from the signed-off previous site.
 * No advisors are listed; none have consented.
 */
export const FOUNDERS = [
  {
    name: "Pranauv Shrinaath S",
    role: "Founder & CEO",
    focus: "Post-quantum cryptography & blockchain",
    photo: "/founders/pranauv-portrait.jpg",
    w: 760,
    h: 950,
    tag: "sig · ML-DSA-65",
    points: [
      "ipsec-pqc-ikev2 — published research mapping ML-KEM into IKEv2 (liboqs / C).",
      "Research on decentralising public banks, secured with PQC + Hyperledger Fabric.",
      "Onsite research internship, NUS Singapore.",
      "Building since 14.",
    ],
    email: "pranauvshrinaath@northwindcipher.com",
    github: "https://github.com/KenidoesCode",
  },
  {
    name: "Kailosh Kalimuthu",
    role: "Co-Founder & CTO",
    focus: "Trusted execution environments & AI inference",
    photo: "/founders/kailosh-portrait.jpg",
    w: 760,
    h: 1138,
    tag: "tee · intel-tdx",
    points: [
      "Built BIFROST — a decentralised P2P comms / storage / compute network.",
      "Repurposes idle hardware into an encrypted, distributed micro-cloud.",
      "6 months building with US startup Decipher.",
      "Building since 16.",
    ],
    email: "kailoshkalimuthu@northwindcipher.com",
    github: "https://github.com/Sk1zmo",
  },
] as const;
