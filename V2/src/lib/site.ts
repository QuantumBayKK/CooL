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

/** Every indexable route, with the weighting the sitemap should carry. */
export const ROUTES = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  // The eleven-slide deck. Lower priority than the landing page on purpose:
  // it is for presenting, and it is not the page a search result should open.
  { path: "/deck", priority: 0.7, changeFrequency: "monthly" as const },
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
  // /investors and /investors/diligence are deliberately absent. Both are
  // `noindex`, and submitting a noindex URL in a sitemap asks a crawler to
  // index the one page carrying the raise terms while the page itself refuses
  // — a contradiction that at best wastes crawl budget and at worst gets the
  // SAFE terms surfaced next to the product.
  { path: "/billboard", priority: 0.6, changeFrequency: "monthly" as const },
] as const;
