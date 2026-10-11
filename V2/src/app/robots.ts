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
/**
 * Crawlers that are welcomed by name. They are already covered by `*`; naming
 * them is a statement of intent for the ones that look for their own group
 * first, and it keeps the AI answer engines — which increasingly decide whether
 * a company is "found" at all — explicitly in scope.
 */
const NAMED_CRAWLERS = [
  "Googlebot",
  "Googlebot-Image",
  "Bingbot",
  "DuckDuckBot",
  "Applebot",
  "YandexBot",
  "Baiduspider",
  "LinkedInBot",
  "Twitterbot",
  "facebookexternalhit",
  "Slackbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

/**
 * Only `/api/` is disallowed: it returns JSON that would be indexed as
 * gibberish. `/_next/static/` used to be disallowed too, which was wrong —
 * Google renders pages with their JS and CSS, and blocking those files makes
 * it see a broken page.
 */
const DISALLOW = ["/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: NAMED_CRAWLERS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
