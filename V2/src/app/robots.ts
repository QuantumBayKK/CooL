import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * robots.txt
 *
 * The public site is fully open — the whole argument is "check it yourself",
 * and a product that asks to be verified should not be hiding from crawlers.
 *
 * ## Why /investor and /admin are NOT disallowed here
 *
 * This looks like an omission and it is deliberate. `Disallow` and `noindex` do
 * different jobs, and using the wrong one on a private route makes it MORE
 * visible, not less:
 *
 *   · `Disallow` stops a crawler fetching the page. It does not stop the URL
 *     being indexed — a URL discovered from any inbound link can still appear
 *     in results as a bare, description-less entry.
 *   · `noindex` removes the URL from the index outright, but the crawler has to
 *     FETCH the page to see the directive.
 *
 * Combine them and they cancel: `Disallow` prevents the fetch, so the `noindex`
 * is never read, and the URL can sit in the index permanently with no way to
 * remove it. That is the classic failure.
 *
 * Worse, robots.txt is a public file. Listing `/investor` in it publishes the
 * existence and path of the private area to anyone who types the URL — which is
 * the first thing anyone probing a site does.
 *
 * So the private routes are left absent from this file, and are protected by:
 *   · `x-robots-tag: noindex, nofollow, noarchive, nosnippet` from middleware,
 *   · a `robots` metadata block on both route-group layouts,
 *   · absence from the sitemap,
 *   · and, actually, authentication.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Build assets waste crawl budget and never belong in an index. `/api/`
        // returns JSON that would be indexed as gibberish.
        disallow: ["/_next/static/chunks/", "/api/"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
