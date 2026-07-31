import type { MetadataRoute } from "next";
import { ROUTES, SITE } from "@/lib/site";

/**
 * The sitemap.
 *
 * `lastModified` is pinned to the build, not `new Date()` evaluated per
 * request: these are statically generated pages, so claiming they changed on
 * every crawl trains search engines to distrust the field.
 */
const BUILT_AT = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({
    url: `${SITE.url}${r.path === "/" ? "" : r.path}`,
    lastModified: BUILT_AT,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
