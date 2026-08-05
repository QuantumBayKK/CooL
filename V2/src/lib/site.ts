/**
 * One source of truth for anything that has to agree across metadata,
 * structured data, the sitemap and the OG images.
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
  tagline: "The black box for AI",
  description:
    "Every change your company makes to its AI — documented, approved, filed and provable, automatically. CooL deletes the weeks of manual compliance work behind AI changes and cuts the cost by up to 90%.",
} as const;

/**
 * Every indexable route, with the weighting the sitemap should carry.
 *
 * THE RULE: a route that carries the raise terms, the use of funds, or the
 * named validators is never listed here, and carries `robots: { index: false }`
 * on its own metadata. Those two facts have to travel together — a sitemap
 * entry for a `noindex` page asks a crawler to index the one page that refuses
 * to be indexed, which at best wastes crawl budget and at worst gets the SAFE
 * terms surfaced next to the product.
 *
 * Three routes are deliberately absent, for that one reason:
 *
 *   /investors            — the ask, the use of funds, the named validators.
 *                           Server-gated as well; see lib/investor-access.ts.
 *   /investors/diligence  — the same material, presented at length. Also gated.
 *   /deck                 — states the ask on slides 01 and 11 ("₹1 Cr",
 *                           "SAFE · ₹10 Cr cap"). It was listed here at
 *                           priority 0.7 while carrying that copy, which is the
 *                           exact contradiction this comment exists to prevent;
 *                           an audit caught it. The deck keeps its copy and
 *                           loses its crawlability: it is a link you send to a
 *                           named person, not a page you rank for.
 *
 * Adding a route here is therefore a decision about disclosure, not about SEO.
 * Before adding one, grep it for the raise terms and the validator names.
 */
export const ROUTES = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  // The long read. High priority because it is the page that answers the only
  // question a first-time reader actually has, and the one worth ranking for.
  { path: "/why", priority: 0.95, changeFrequency: "monthly" as const },
  // The demo: one prompt edit, and everything that follows from it. The link
  // that gets sent to a partner who asked to see the thing working.
  { path: "/demo", priority: 0.95, changeFrequency: "monthly" as const },
  // The same machinery with the lid off, stage by stage.
  { path: "/pipeline", priority: 0.85, changeFrequency: "monthly" as const },
  { path: "/dashboard", priority: 0.9, changeFrequency: "monthly" as const },
  // The SDK + console + IDE. The page a technical partner is sent to.
  { path: "/studio", priority: 0.9, changeFrequency: "monthly" as const },
  // Install instructions and the published artefacts. The developer entry point.
  { path: "/sdk", priority: 0.9, changeFrequency: "monthly" as const },
  // /deck, /investors and /investors/diligence are deliberately absent — see
  // the rule at the top of this block. All three carry the raise.
  { path: "/billboard", priority: 0.6, changeFrequency: "monthly" as const },
] as const;
