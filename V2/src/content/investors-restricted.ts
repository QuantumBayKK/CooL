/**
 * The restricted half of the investor content.
 *
 * WHY THIS FILE EXISTS SEPARATELY FROM ./investors.ts
 *
 * Everything here is material that must not reach a browser that has not
 * proved access: the ask, the use of funds, the twelve-month roadmap, and the
 * five named practitioners who let us quote them. Those names are the most
 * sensitive thing on the site — they are real people who spoke to us in
 * confidence, and they were never asked to have their employer published next
 * to a fundraise.
 *
 * THE RULE, AND IT IS ABSOLUTE
 *
 * Nothing in a "use client" module may import from this file, directly or
 * transitively. A client component compiles its imports into a JavaScript
 * chunk that is served to anyone who asks for it — no cookie, no passcode, no
 * server-side check anywhere in the path. Importing this file from the client
 * would put these names into a public asset while the page above them looked
 * gated.
 *
 * That is not hypothetical. Until this split, InvestorKeynote was a client
 * component that imported all of this, so the built chunk
 * .next/static/chunks/app/investors/diligence/page-*.js contained "Lokesh",
 * "Proneet", "Alluri", "Ojas Tripathi", "Ayush Kumar", "Jio Payments",
 * "PayU", "pre-seed", "post-money" and the rupee figures — on a route that
 * had no gate on it at all.
 *
 * The safe pattern, and the one now used: a SERVER component imports this,
 * checks access, and passes what it needs down as props. Props cross into the
 * client as part of the rendered payload of an authorised request, which is
 * exactly the boundary we want — the data travels only when the request has
 * already earned it.
 *
 * If you need one of these values in a client component, do not import it
 * here. Thread it as a prop from a server component that has called
 * hasInvestorAccess() first.
 *
 * (Node would enforce this for us via the `server-only` package, which is not
 * a dependency of this project and cannot be added from the website track. The
 * enforcement is therefore this comment plus the grep recorded in
 * QA_REPORT.md, which checks every built chunk for every one of these
 * strings.)
 */

/* ── practitioners, moved here from the deck ──────────────────────────── */
export interface Voice {
  readonly quote: string;
  readonly name: string;
  readonly role: string;
  readonly tag: string;
}

/**
 * These sat on the deck as a slide of their own, which interrupted the argument
 * between the problem and the solution. They belong here: they are evidence for
 * someone already deciding, not persuasion for someone still listening.
 */
export const VOICES: readonly Voice[] = [
  {
    quote:
      "As AI adoption grows in BFSI, an additional cryptographic verification layer for sensitive AI decisions would be valuable. Banking and financial institutions dealing with regulated customer data would definitely be interested in evaluating such a solution.",
    name: "Lokesh G.A.",
    role: "Head of Product Solutions & Strategy, Jio Payments",
    tag: "FinTech",
  },
  {
    quote:
      "The idea is technically sound and aligns with the need to securely protect enterprise AI execution while keeping sensitive data within the company's own environment. This is the kind of product that would first be evaluated by engineering and product teams before moving through enterprise procurement.",
    name: "Proneet Nibedit",
    role: "Technical Lead — Backend Engineering, PayU",
    tag: "Payments",
  },
  {
    quote:
      "Having built confidential computing infrastructure for over three years, I've seen how difficult the trust and verification layer is. CooL's backend SDK tackles this directly, and as AI moves onto confidential infrastructure, a verification layer like this becomes genuinely valuable.",
    name: "Ayush Kumar Yadav",
    role: "Backend Engineer (ex-Marlin Protocol / Oyster)",
    tag: "Confidential computing",
  },
  {
    quote:
      "A cryptographically verifiable trust layer for AI is definitely a real problem worth solving. Having a trustworthy way to verify AI execution is an important direction for the industry.",
    name: "Alluri Siddhartha",
    role: "Research & Engineering, Ritual",
    tag: "AI infrastructure",
  },
  {
    quote:
      "As AI systems become increasingly autonomous, this problem becomes much more relevant. I can definitely see organizations adopting a solution like this.",
    name: "Ojas Tripathi",
    role: "Associate Software Engineer, PayU",
    tag: "Payments",
  },
];

/* ── 8 · where the money goes ─────────────────────────────────────────── */

export interface FundSlice {
  readonly label: string;
  readonly pct: number;
  readonly color: string;
}

export const FUNDS: readonly FundSlice[] = [
  { label: "People", pct: 30, color: "#58a6ff" },
  { label: "Engineering & R&D", pct: 25, color: "#3fb950" },
  { label: "Go-to-market", pct: 15, color: "#1f6feb" },
  { label: "Infrastructure", pct: 12, color: "#8b949e" },
  { label: "Compliance & legal", pct: 8, color: "#d29922" },
  { label: "Marketing", pct: 6, color: "#a371f7" },
  { label: "Buffer", pct: 4, color: "#484f58" },
];

export const PHASES: readonly (readonly [string, string])[] = [
  ["0–2 months", "ship the product to first customers"],
  ["2–6 months", "paid pilots with regulated design partners"],
  ["6–9 months", "pilots convert to recurring revenue"],
  ["9–12 months", "raise the seed on real usage"],
];

/**
 * Two lines of the keynote's own prose that name the round.
 *
 * They read as ordinary copy, which is exactly why they are dangerous: they sat
 * as string literals inside a "use client" component, so "pre-seed" and "₹1 Cr"
 * were compiled into a public chunk while every constant around them was being
 * carefully gated. Copy leaks as readily as data. Anything that names the round
 * belongs in this file, whatever shape it happens to have.
 */
export const RESTRICTED_COPY = {
  fundsHeadline: "What ₹1 Cr becomes, in eight weeks.",
  buyBuildLead:
    "A pre-seed team that rebuilds a Merkle log, a policy engine and a workflow engine ships nothing.",
  /** The eyebrow over the money stage. The label alone names the table. */
  fundsEyebrow: "Use of funds",
  /**
   * The keynote's opening lead, moved here whole because its last clause is
   * "precisely what ₹1 Cr turns into". It read as ordinary scene-setting and
   * lived in the public content module, so it compiled into a client chunk.
   */
  heroKicker: "Technical & operational diligence",
  heroTitle: "The part of the pitch that has to survive an engineer.",
  heroLead:
    "The deck makes the case. This is the working: how CooL is architected, what actually runs today, what we deliberately refuse to build, and precisely what ₹1 Cr turns into.",
  /**
   * The investor mailto. Its SUBJECT names the round —
   * "Pre-seed investment (₹1 Cr iSAFE)" — url-encoded, which is why a
   * case-sensitive grep for "pre-seed" sailed straight past it during the first
   * audit. It is defined in components/Nav.tsx, a client module, and the deck
   * still uses it there; the gated routes take this copy instead so that the
   * string never enters the chunk an ungated request is told to fetch.
   */
  investMailto:
    "mailto:northwindcipher@gmail.com?subject=CooL%20%E2%80%94%20Pre-seed%20investment%20(%E2%82%B91%20Cr%20iSAFE)",
} as const;

export const TERMS = {
  amount: "₹1 Crore",
  instrument: "SAFE",
  cap: "₹10 Cr post-money cap",
  runway: "12 months",
  entity: "Northwind Cipher Pvt. Ltd.",
} as const;
