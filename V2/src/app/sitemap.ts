import type { MetadataRoute } from "next";
import { allPosts } from "@/lib/blog";
import { allDocs } from "@/lib/docs";
import { ROUTES, SITE } from "@/lib/site";

/**
 * The sitemap.
 *
 * `lastModified` is pinned to the build, not `new Date()` evaluated per
 * request: these are statically generated pages, so claiming they changed on
 * every crawl trains search engines to distrust the field.
 *
 * Every docs page is listed, not just `/docs` — the deep pages (quickstart,
 * receipt format, threat model) are the ones a developer searches for.
 */
const BUILT_AT = new Date();

/** Images a search engine should associate with the front door. */
const HOME_IMAGES = [
  `${SITE.url}/opengraph-image`,
  `${SITE.url}/founders/pranauv-portrait.jpg`,
  `${SITE.url}/founders/kailosh-portrait.jpg`,
  `${SITE.url}/partners/wiwo-best-of-technology-2026.png`,
];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = ROUTES.map((r) => ({
    url: `${SITE.url}${r.path === "/" ? "/" : r.path}`,
    lastModified: BUILT_AT,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
    ...(r.path === "/" ? { images: HOME_IMAGES } : {}),
  }));

  const listed = new Set<string>(ROUTES.map((r) => r.path));
  const docs: MetadataRoute.Sitemap = allDocs()
    .map((d) => (d.slug ? `/docs/${d.slug}` : "/docs"))
    .filter((path) => !listed.has(path))
    .map((path) => ({
      url: `${SITE.url}${path}`,
      lastModified: BUILT_AT,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    }));

  const posts: MetadataRoute.Sitemap = allPosts().map((p) => ({
    url: `${SITE.url}/blog/${p.slug}`,
    lastModified: new Date(`${p.date}T00:00:00Z`),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...pages, ...docs, ...posts];
}
