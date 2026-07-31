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
  { path: "/demo", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/dashboard", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/investors", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/billboard", priority: 0.6, changeFrequency: "monthly" as const },
] as const;
