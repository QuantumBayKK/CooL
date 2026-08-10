/**
 * The investor room's table of contents.
 *
 * Data rather than twelve hand-written page files, so the navigation, the
 * overview grid, the audit subjects and the routes cannot disagree with each
 * other. Adding a section is one entry here.
 *
 * ## On `state`
 *
 * Every section declares whether its content actually exists yet.
 *
 *   `ready`    — real content, written and reviewed.
 *   `awaiting` — the container is built and the structure is correct, but the
 *                figures have not been supplied. The page says so plainly.
 *   `off`      — not applicable to this raise; hidden from navigation entirely.
 *
 * `awaiting` renders an explicit empty state rather than lorem ipsum or
 * invented numbers. An investor who opens "Financial projections" and finds
 * fabricated figures has learned something fatal about the company; one who
 * finds "not yet published — ask us" has learned nothing bad at all. This is
 * the same discipline the public site applies to `simulated` attestation.
 */

export type SectionState = "ready" | "awaiting" | "off";

export interface RoomSection {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly group: "The case" | "The numbers" | "The product" | "Diligence";
  readonly state: SectionState;
  /** Shown on the section page when `state` is `awaiting`. */
  readonly awaitingNote?: string;
}

export const ROOM_SECTIONS: readonly RoomSection[] = [
  /* ── the case ─────────────────────────────────────────────────────────── */
  {
    slug: "overview",
    title: "Overview",
    summary: "Where the company is, what is real, and what the money buys.",
    group: "The case",
    state: "ready",
  },
  {
    slug: "deck",
    title: "Pitch deck",
    // The twelve slides, transcribed verbatim and rendered in the site's own
    // typography rather than embedded as a PDF. The version guarantee that
    // used to justify file-only distribution is kept — one source in git, with
    // a diff on every change — while the file itself stays in the data room
    // for anyone who wants the artefact. See `content/deck.ts`.
    summary: "The narrative: problem, product, market, ask.",
    group: "The case",
    state: "ready",
  },
  {
    slug: "roadmap",
    title: "Roadmap",
    summary: "The readiness ladder, dated, with what each rung unblocks.",
    group: "The case",
    state: "ready",
  },
  {
    slug: "market",
    title: "Market validation",
    summary: "Who has said they would buy this, and what they said.",
    group: "The case",
    state: "awaiting",
    awaitingNote:
      "Design-partner conversations are in progress. This section stays empty until there is something quotable with permission to quote it — a market-validation page built from optimism is worse than no page.",
  },
  {
    slug: "competition",
    title: "Competitive analysis",
    summary: "Who else is near this problem, and where the boundary is.",
    group: "The case",
    state: "ready",
  },

  /* ── the numbers ──────────────────────────────────────────────────────── */
  {
    slug: "financials",
    title: "Financial projections",
    summary: "Model, assumptions, and the sensitivity that matters.",
    group: "The numbers",
    state: "awaiting",
    awaitingNote:
      "Not published in the room. Projections are shared directly, with the assumptions attached and a live conversation around them — a spreadsheet read without its assumptions is how a number becomes a commitment nobody agreed to.",
  },
  {
    slug: "cap-table",
    title: "Cap table",
    summary: "Ownership, instruments outstanding, and post-round dilution.",
    group: "The numbers",
    state: "awaiting",
    awaitingNote:
      "Shared on request under NDA at term-sheet stage rather than posted to every code holder.",
  },
  {
    slug: "tokenomics",
    title: "Tokenomics",
    summary: "Token design, supply and distribution.",
    group: "The numbers",
    // Off, and honestly so: there is no token. A tokenomics page for a company
    // with no token is the single fastest way to lose a serious infrastructure
    // investor.
    state: "off",
  },

  /* ── the product ──────────────────────────────────────────────────────── */
  {
    slug: "architecture",
    title: "Architecture",
    summary: "How the evidence plane is built, and what each boundary buys.",
    group: "The product",
    state: "ready",
  },
  {
    slug: "demos",
    title: "Private demos",
    summary: "Walkthroughs not linked from the public site.",
    group: "The product",
    state: "awaiting",
    awaitingNote:
      "The public demos at /verify and /pipeline run the same cryptography an investor would be shown. Anything genuinely private lands here when it exists.",
  },
  {
    slug: "pipeline",
    title: "Customer pipeline",
    summary: "Conversations in flight, stage by stage.",
    group: "The product",
    state: "awaiting",
    awaitingNote:
      "Named conversations are not published to the room without the counterparty's consent. Ask and we will walk you through the live list.",
  },

  /* ── diligence ────────────────────────────────────────────────────────── */
  {
    slug: "diligence",
    title: "Technical diligence",
    summary: "The engineering judgement, in full, including what we refuse.",
    group: "Diligence",
    state: "ready",
  },
  {
    slug: "faq",
    title: "Investor FAQ",
    summary: "The questions that come up every time.",
    group: "Diligence",
    state: "ready",
  },
  {
    slug: "data-room",
    title: "Data room",
    summary: "Documents, downloadable. Every download is logged.",
    group: "Diligence",
    state: "ready",
  },
] as const;

/** Sections that appear in navigation. `off` is hidden, not greyed out. */
export const VISIBLE_SECTIONS = ROOM_SECTIONS.filter((s) => s.state !== "off");

export const SECTION_GROUPS = [
  "The case",
  "The numbers",
  "The product",
  "Diligence",
] as const;

export function findSection(slug: string): RoomSection | undefined {
  return ROOM_SECTIONS.find((s) => s.slug === slug);
}
