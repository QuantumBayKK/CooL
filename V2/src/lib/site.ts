/**
 * One source of truth for anything that has to agree across metadata,
 * structured data, the sitemap, the navigation and the OG images.
 *
 * These strings end up in canonical URLs and JSON-LD `@id`s, where a mismatch
 * is not a cosmetic bug — two spellings of the origin split the site's identity
 * across two entities as far as a crawler is concerned.
 */
export const SITE = {
  name: "CooL",
  company: "Northwind Cipher Pvt. Ltd.",
  /** Production origin, no trailing slash. */
  url: "https://northwindcipher.com",
  tagline: "Cryptographic evidence for AI change",
  description:
    "CooL seals every change to your AI — prompt, model, permission — as a signed, tamper-evident record. Verify any record yourself, offline, with a verifier we do not control.",
  repo: "https://github.com/KenidoesCode/cool-sdk",
  npm: "https://www.npmjs.com/package/cool-nwc",
} as const;

export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly description?: string;
}

export interface NavGroup {
  readonly label: string;
  readonly items: readonly NavItem[];
}

/**
 * Primary navigation.
 *
 * Five top-level entries. Phala runs five; Stripe runs five; the number is not
 * a coincidence — past about six, a horizontal bar stops being scannable and
 * starts being a list the reader has to read. Anything that does not earn a top
 * slot lives inside a group or in the footer.
 */
export const NAV: readonly (NavItem | NavGroup)[] = [
  // Top level, not inside a group. The demo is the most persuasive thing on
  // the site — it runs the real cryptography and invites the visitor to attack
  // it — and it previously lived only at the bottom of a 17-screen homepage
  // and at `/pipeline`, which appeared in no menu. A thing that good has to be
  // one click from every page.
  { label: "Demo", href: "/demo" },
  {
    label: "Product",
    items: [
      {
        label: "How CooL works",
        href: "/technology",
        description: "Capture, seal, verify — the whole pipeline in order.",
      },
      {
        label: "Architecture",
        href: "/architecture",
        description: "Where each part runs and which boundary it sits behind.",
      },
      {
        label: "Verify a record",
        href: "/verify",
        description: "Run the real cryptography in your own browser.",
      },
      {
        label: "Console",
        href: "/console",
        description: "The operator's view over sealed evidence.",
      },
    ],
  },
  {
    label: "Security",
    items: [
      {
        label: "Security model",
        href: "/security",
        description: "Threat model, trust boundaries, and what we cannot do.",
      },
      {
        label: "Readiness",
        href: "/security/readiness",
        description: "The gate ladder, and exactly which rung we are on.",
      },
    ],
  },
  { label: "Docs", href: "/docs" },
  { label: "Pricing", href: "/pricing" },
  { label: "Company", href: "/about" },
] as const;

/**
 * Routes that own the whole viewport.
 *
 * These are not documents with a header on top — they are single-screen
 * instruments. The walkthrough sizes itself to `100dvh` minus the site header
 * and expects nothing above or below it; mounted inside the normal shell it
 * got a breadcrumb bar pushed onto its top and a four-column marketing footer
 * hung off its bottom, so the deck's own rail scrolled out of view the moment
 * anyone reached for the Save button. The rail is the thing that makes it a
 * walkthrough, so losing it is not a cosmetic problem.
 *
 * One list, consumed by the breadcrumbs, the footer gate and the sticky mobile
 * bar, so a surface cannot be full-bleed according to one of them and not the
 * others.
 */
export const FULL_BLEED: readonly string[] = [
  "/verify",
  "/console",
  "/studio",
  "/billboard",
];

/** True when `pathname` is one of the full-bleed surfaces, or inside one. */
export function isFullBleed(pathname: string): boolean {
  return FULL_BLEED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "items" in item;
}

/** Footer columns. Deeper than the header on purpose — this is where the long tail lives. */
export const FOOTER: readonly NavGroup[] = [
  {
    label: "Product",
    items: [
      { label: "Run the demo", href: "/demo" },
      { label: "How CooL works", href: "/technology" },
      { label: "Architecture", href: "/architecture" },
      { label: "Verify a record", href: "/verify" },
      { label: "Console", href: "/console" },
      { label: "Studio", href: "/studio" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    label: "Developers",
    items: [
      { label: "Documentation", href: "/docs" },
      { label: "Quickstart", href: "/docs/quickstart" },
      { label: "Verify it yourself", href: "/docs/verify-it-yourself" },
      { label: "Receipt format", href: "/docs/receipt-format" },
      { label: "SDK on npm", href: SITE.npm },
    ],
  },
  {
    label: "Trust",
    items: [
      { label: "Security model", href: "/security" },
      { label: "Readiness ladder", href: "/security/readiness" },
      { label: "Threat model", href: "/docs/threat-model" },
      { label: "What is simulated", href: "/security#simulated" },
    ],
  },
  {
    label: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/#faq" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Investor access", href: "/investor" },
    ],
  },
] as const;

/**
 * Every indexable route, with the weighting the sitemap should carry.
 *
 * `/investor*` and `/admin*` are deliberately absent, and they are also
 * `noindex`. Submitting a noindex URL in a sitemap asks a crawler to index a
 * page that refuses to be indexed — at best it wastes crawl budget, at worst it
 * surfaces the existence of the private routes in a coverage report.
 */
export const ROUTES = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/technology", priority: 0.95, changeFrequency: "monthly" as const },
  { path: "/architecture", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/security", priority: 0.95, changeFrequency: "monthly" as const },
  { path: "/security/readiness", priority: 0.85, changeFrequency: "weekly" as const },
  { path: "/verify", priority: 0.95, changeFrequency: "monthly" as const },
  { path: "/console", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/studio", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/docs", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/pricing", priority: 0.85, changeFrequency: "monthly" as const },
  { path: "/demo", priority: 0.95, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  // `/thank-you` is deliberately absent: it is `noindex`, and submitting a
  // noindex URL asks a crawler to index a page that refuses to be indexed.
] as const;
