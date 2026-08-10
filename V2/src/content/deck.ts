/**
 * The pre-seed deck, as data.
 *
 * Transcribed from `CooL_Pitch_Deck_2.pptx` so the investor room can render
 * the narrative in the site's own typography instead of embedding a slide
 * image or making an investor download a file to read twelve paragraphs.
 *
 * ── the rule this file lives under ──
 *
 * The numbers, the ask, the cap, the market figures and the team claims are
 * transcribed VERBATIM from the deck. Not paraphrased, not rounded, not
 * improved. An investor who reads ₹10 Cr here and ₹10 Cr in the PDF has two
 * copies of one document; if this file "tidied" a figure, they would have two
 * documents, and the company would have a diligence problem it created itself.
 *
 * Where the deck attributes a figure to a source (Forrester, Gartner), the
 * attribution is carried across with it. A market number without its source is
 * an assertion.
 *
 * `state: "planned"` marks anything that has not happened yet — the pipeline,
 * the roadmap, the returns table. The deck labels these honestly ("Pre-launch.
 * This is the planned pipeline — not booked traction.") and that labelling is
 * part of the content, not decoration to be dropped in the port.
 */

export interface DeckPoint {
  readonly n?: string;
  readonly title: string;
  readonly body: string;
}

export interface DeckSlide {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  /** One paragraph under the title. */
  readonly lead?: string;
  readonly points?: readonly DeckPoint[];
  /** Label/value pairs rendered as a hairline table. */
  readonly rows?: readonly (readonly [string, string])[];
  /** Two-column comparison. */
  readonly split?: {
    readonly leftTitle: string;
    readonly left: readonly string[];
    readonly rightTitle: string;
    readonly right: readonly string[];
  };
  /** Big figures. */
  readonly figures?: readonly { k: string; v: string; note: string }[];
  /** Printed in a bordered footnote at the base of the slide. */
  readonly footnote?: string;
  /** Renders a "not yet true" marker at the top of the slide. */
  readonly planned?: boolean;
}

export const DECK_META = {
  stamp: "Pre-seed · India · 2026 · Confidential",
  company: "NorthWind Cipher Pvt Ltd",
  ask: "₹1 Crore",
  terms: "10% equity · iSAFE · ₹10 Cr post-money cap",
  founders: [
    { name: "Pranauv Shrinaath S", role: "Founder & CEO", city: "Chennai" },
    { name: "Kailosh Kalimuthu", role: "Co-founder & CTO", city: "Bangalore" },
  ],
  contact: "pranauvkeni@gmail.com",
} as const;

export const DECK: readonly DeckSlide[] = [
  {
    id: "thesis",
    eyebrow: "01 — The thesis",
    title: "The black box for AI.",
    lead: "CooL — Cryptographic Observability and On-chain Ledger. A durable, independent, hardware-backed cryptographic record of exactly what an AI system computed: which model, on which input, producing which output, and when.",
    rows: [
      ["Ask", "₹1 Crore"],
      ["Instrument", "iSAFE · 10% equity · ₹10 Cr post-money cap"],
      ["Entity", "NorthWind Cipher Pvt Ltd (incorporated)"],
      ["Runway", "12 months"],
    ],
  },
  {
    id: "problem",
    eyebrow: "02 — The problem",
    title: "When AI decides and someone is harmed, no one can prove what it actually did.",
    points: [
      {
        n: "01",
        title: "AI makes legally consequential decisions.",
        body: "Loans, diagnoses, arrests, insurance claims, hiring — a model decides, a person is affected, and the law assumes that decision can be accounted for.",
      },
      {
        n: "02",
        title: "The only answer is “the model decided.”",
        body: "Which version ran, which factor was decisive, what it actually output — the reasoning is gone the moment the query ends.",
      },
      {
        n: "03",
        title: "The evidence that exists is worthless.",
        body: "Every log sits on servers owned by the bank, hospital, insurer or police — editable by the party with the most reason to edit it after a complaint lands.",
      },
      {
        n: "04",
        title: "So nothing can be proven.",
        body: "No court or regulator can establish which model, fed which input, produced which output, at which moment — in a form the operator couldn’t have quietly rewritten.",
      },
    ],
    footnote:
      "Nothing in the stack fixes this. A neutral, tamper-proof record of what a model did is simply absent — that gap is what CooL is built to fill.",
  },
  {
    id: "solution",
    eyebrow: "03 — The solution",
    title: "CooL is the black box for AI.",
    lead: "A durable, independent, hardware-backed cryptographic record of exactly what an AI computed — which model ran, on which input, producing which output, and when — sealed so that not even the company operating the AI could have forged it.",
    points: [
      { title: "Model", body: "which model ran" },
      { title: "Input", body: "on which input" },
      { title: "Output", body: "producing which output" },
      { title: "Time", body: "and at which exact moment" },
    ],
    footnote:
      "Integration is one changed line of code: cool.complete(prompt). Hardware-sealed, operator-resistant, verifiable by anyone, offline. When a regulator, a court, or a customer asks an AI company to prove what its system actually did — CooL is the artefact that answers.",
  },
  {
    id: "technology",
    eyebrow: "04 — Technology & moat",
    title: "A hardware-rooted record, built to stand as evidence for decades.",
    points: [
      {
        n: "Core",
        title: "TEE attestation of inference",
        body: "The model runs inside a confidential-compute enclave — NVIDIA Confidential Compute or Intel TDX — that emits a hardware-signed quote binding model, input, output and time.",
      },
      {
        n: "+ PQC",
        title: "Post-quantum cryptography",
        body: "ML-KEM-1024 and ML-DSA-65 — the proof survives as evidence for decades.",
      },
      {
        n: "+ Log",
        title: "Witnessed Merkle transparency log",
        body: "The proven structure behind Certificate Transparency and Sigstore — the working ledger.",
      },
      {
        n: "+ Anchor",
        title: "Once-per-epoch on-chain anchor",
        body: "The log’s signed root anchored to a public chain — not even CooL can rewrite history.",
      },
    ],
    footnote:
      "TRL 4. The moat is not a patent. It is the witnessed, compliance-mapped evidentiary record, prospective India sovereign standing (CERT-In / STQC empanelment), and a rare applied-PQC credential — the founder’s ipsec-pqc-ikev2, one of ~200 ML-KEM projects worldwide. Capital cannot shortcut a witnessed record or a regulator’s trust.",
  },
  {
    id: "proof",
    eyebrow: "05 — Proof · v0 shipped",
    title: "The hard cryptography already runs.",
    split: {
      leftTitle: "Working now — real",
      left: [
        "Real ML-DSA-65 (FIPS 204) signatures",
        "RFC 6962 Merkle transparency log + inclusion proofs",
        "Canonical InferenceRecord, SHA-256 commitments",
        "verifyReceipt() — full chain checked offline, without us",
        "cool.complete(prompt) — OpenAI-compatible drop-in",
      ],
      rightTitle: "Mocked — stated honestly",
      right: [
        "TEE attestation quote — labelled MockAttestor",
        "On-chain anchor — local FileAnchor (writes locally)",
      ],
    },
    footnote:
      "We don’t hide what’s stubbed. The first milestone of this round turns the mock into a real NVIDIA CC / Intel TDX attestor — the rest of the chain is already built around it. Delivered as a working TypeScript SDK (Node 22, no build step) with a verifiable receipt you can check yourself.",
  },
  {
    id: "market",
    eyebrow: "06 — Market",
    title: "Legislated into existence — growing 30–40% a year.",
    figures: [
      {
        k: "TAM",
        v: "$15.8B",
        note: "AI-governance software by 2030 (Forrester) — 7% of all AI software spend",
      },
      {
        k: "SAM",
        v: "$3–5B",
        note: "The regulated audit / evidentiary slice: BFSI · health · government · legal",
      },
      {
        k: "SOM",
        v: "$15–40M",
        note: "CooL’s India-first capture over 3–5 years via open-core conversion",
      },
    ],
    points: [
      { title: "EU AI Act", body: "Audit-trail duties in force." },
      { title: "India", body: "DPDP Act and RBI model-governance." },
      { title: "CERT-In / STQC", body: "Sovereign procurement gate." },
      { title: "US sectoral", body: "HIPAA-AI, FINRA model rules." },
    ],
    footnote:
      "Gartner: AI regulation quadruples by 2030, reaching 75% of world economies. Analyst range: $1B (Gartner, platforms) to $15.8B (Forrester, governance software) by 2030.",
  },
  {
    id: "model",
    eyebrow: "07 — Business model",
    title: "Open-core. Open the format, monetise the compliance.",
    split: {
      leftTitle: "Open — free",
      left: [
        "The receipt format, the verifier, the SDK",
        "Anyone can issue and verify a CooL receipt",
        "Drives adoption, trust and neutrality",
        "Becomes the default standard developers reach for",
      ],
      rightTitle: "Commercial — recurring",
      right: [
        "Managed transparency log + witness / timestamp service",
        "Compliance mapping — RBI · DPDP · HIPAA · EU AI Act",
        "Empanelment-backed enterprise SLAs",
        "Sovereign / on-prem deployments",
      ],
    },
    footnote:
      "The Sigstore / Chainguard playbook. Per-receipt + per-seat + enterprise licence. Why it compounds: the open format earns the trust and adoption; the regulated record and the compliance obligations are what enterprises pay for, every year.",
  },
  {
    id: "competition",
    eyebrow: "08 — Competition",
    title: "Adjacent players exist. None produce an operator-resistant record of inference.",
    rows: [
      ["Prove AI (Casper Labs)", "Anchors training data — not hardware-attested inference"],
      ["zkML (EZKL et al.)", "Costly; no hardware identity or operator-resistance at scale"],
      [
        "Hyperscaler confidential AI (Apple PCC · AWS · Azure)",
        "Vendor-captive — not independent, third-party verifiable",
      ],
      [
        "TEE inference networks (Phala · Chutes / Bittensor)",
        "Infra for network operators — not a compliance evidentiary product",
      ],
      ["AI-governance / GRC (Credo AI, etc.)", "Policy, monitoring and documentation — not cryptographic evidence"],
    ],
  },
  {
    id: "gtm",
    eyebrow: "09 — Go to market",
    title: "Land on open-source trust. Expand into compliance contracts.",
    planned: true,
    points: [
      {
        n: "Phase 0",
        title: "0–6 months · earn credibility",
        body: "Open-source SDK launch and developer adoption. Ship the real TEE attestation demo. Warm-intro outreach to 3–5 design partners in RBI-regulated fintech and health-tech.",
      },
      {
        n: "Phase 1",
        title: "6–18 months · prove willingness to pay",
        body: "Two to three paid design partners and reference deployments. CERT-In / ISO 27001 groundwork. Seed raise on demonstrated demand.",
      },
      {
        n: "Phase 2",
        title: "18–36 months · scale and go sovereign",
        body: "Enterprise compliance contracts across BFSI, health and legal. Sovereign and government (IndiaAI). Expansion to EU and Middle-East markets.",
      },
    ],
    footnote:
      "Motion: open-core adoption pulls developers in; compliance pain converts them to paid; empanelment and neutrality lock in the enterprise.",
  },
  {
    id: "team",
    eyebrow: "10 — Team",
    title: "The rare intersection: applied post-quantum cryptography and TEE inference.",
    points: [
      {
        n: "Founder & CEO · Chennai",
        title: "Pranauv Shrinaath S",
        body: "Post-quantum cryptography and blockchain. ipsec-pqc-ikev2 — one of ~200 global ML-KEM projects, mapping ML-KEM into IKEv2. Research on decentralising public banks, secured with PQC and Hyperledger Fabric. Onsite research internship, NUS Singapore. Five years building, since 14. github.com/KenidoesCode",
      },
      {
        n: "Co-founder & CTO · Bangalore",
        title: "Kailosh Kalimuthu",
        body: "Trusted execution environments and AI inference. Built BIFROST — a decentralised P2P comms, storage and compute network that repurposes idle hardware into an encrypted distributed micro-cloud. Six months with US startup Decipher. Three years building, since 16. github.com/Sk1zmo",
      },
    ],
    footnote:
      "Funded by this round: a senior Rust engineer, and an IITM PhD researcher as cryptography advisor.",
  },
  {
    id: "roadmap",
    eyebrow: "11 — Roadmap & use of funds",
    title: "What ₹1 Crore buys in 12 months.",
    planned: true,
    points: [
      { n: "01", title: "Real TEE attestor", body: "Replace MockAttestor with NVIDIA CC / Intel TDX." },
      { n: "02", title: "Witness + RFC 3161 timestamp", body: "Independent co-signing of the log." },
      { n: "03", title: "Base L2 anchor", body: "The signed root on a public chain, once per epoch." },
      { n: "04", title: "PQC channel encryption", body: "ML-KEM-1024 on the transport." },
      { n: "05", title: "Rust orchestration", body: "The evidence plane in production form." },
    ],
    footnote:
      "In parallel: SISFS / TANSEED filings, founders’ agreement, design-partner pipeline, CERT-In / ISO groundwork. Founder runway across 12 months is ₹20L of the raise.",
  },
  {
    id: "ask",
    eyebrow: "12 — The ask & the vision",
    title: "₹1 Crore for 10%, on an iSAFE at a ₹10 Cr post-money cap.",
    lead: "CooL becomes the default, neutral evidentiary standard for regulated AI — the black box every AI system answers to. Self-attestation always gives way to cryptographic evidence: Certificate Transparency, Sigstore, RFC 3161. CooL brings that one-way migration to AI.",
    rows: [
      ["Raise", "₹1 Crore"],
      ["Instrument", "iSAFE"],
      ["Equity", "10%"],
      ["Post-money cap", "₹10 Crore"],
      ["Runway", "12 months"],
      ["Entity", "NorthWind Cipher Pvt Ltd (incorporated)"],
    ],
    footnote:
      "The deck also carries an illustrative return table from a ₹10 Cr entry. It is explicitly illustrative — a modelled scenario, not a forecast, and not a representation that any of it will occur.",
  },
];
