import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

/**
 * Edge middleware: security headers, and a cheap gate on the private routes.
 *
 * What this middleware does NOT do is authorise anything. It checks only that a
 * session cookie is *present*, and redirects when it is not. The real check —
 * decrypt, look up the row, compare the token hash, confirm not revoked and not
 * expired — happens in `getInvestorSession()` on the page itself.
 *
 * That split is deliberate. Middleware runs on the Edge runtime, where a
 * database round trip on every request (including every static asset that slips
 * through the matcher) is both slow and a new failure mode. More importantly,
 * authorisation that lives only in middleware is one `matcher` typo away from
 * being silently absent — and a matcher typo produces no error, just an open
 * door. Putting the real check in the page means a route added tomorrow without
 * touching this file is still protected.
 *
 * So: middleware is an optimisation that saves a wasted render. The page is the
 * control.
 */

/**
 * Content-Security-Policy.
 *
 * `script-src` carries a per-request nonce and `strict-dynamic`. Together those
 * mean: run only scripts this response vouched for, plus whatever those scripts
 * load — and ignore any host allowlist, which is what makes CSP resistant to
 * the "someone found a JSONP endpoint on an allowlisted CDN" bypass.
 *
 * `'unsafe-inline'` is present as a FALLBACK ONLY. Browsers that understand
 * `strict-dynamic` ignore it; browsers that do not would otherwise block every
 * script and render a blank page. This is the documented compatibility pattern,
 * not a loosening.
 *
 * `style-src` allows `'unsafe-inline'` without apology: Next injects inline
 * styles for font loading and for the streaming shell, and there is no nonce
 * path for them. The risk is materially lower than for script — CSS injection
 * cannot execute — and pretending otherwise by shipping a policy that breaks
 * the site would be worse.
 */
function contentSecurityPolicy(nonce: string, dev: boolean): string {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  return [
    `default-src 'self'`,
    // 'unsafe-eval' in development only — Turbopack's HMR needs it, and it must
    // never reach production.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' ${dev ? "'unsafe-eval'" : ""} https:`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    // The portal talks to Supabase; nothing else is allowed out. In dev the
    // websocket for HMR is added.
    `connect-src 'self' ${supabase} ${dev ? "ws: http://127.0.0.1:*" : ""}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    // Defence in depth beside X-Frame-Options; this one is the standard.
    `frame-ancestors 'none'`,
    `manifest-src 'self'`,
    dev ? "" : `upgrade-insecure-requests`,
  ]
    .filter(Boolean)
    .join("; ")
    .replace(/\s{2,}/g, " ");
}

const PRIVATE_PREFIXES = ["/investor", "/admin"];
const PUBLIC_IN_PRIVATE = ["/investor/login", "/admin/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const dev = process.env.NODE_ENV !== "production";

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);

  const isPrivate = PRIVATE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isLogin = PUBLIC_IN_PRIVATE.some((p) => pathname === p);

  let response: NextResponse;

  if (isPrivate && !isLogin && !request.cookies.has(SESSION_COOKIE_NAME)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.startsWith("/admin")
      ? "/admin/login"
      : "/investor/login";
    // Where they were going, so login can send them back. Only ever a
    // same-origin path — `next` is validated on use, never redirected to raw.
    url.searchParams.set("next", pathname);
    response = NextResponse.redirect(url);
  } else {
    response = NextResponse.next({ request: { headers } });
  }

  response.headers.set("content-security-policy", contentSecurityPolicy(nonce, dev));
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  response.headers.set("cross-origin-opener-policy", "same-origin");

  if (!dev) {
    response.headers.set(
      "strict-transport-security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  // Private routes must never be indexed, cached by a shared proxy, or stored.
  // The meta robots tag on the page is the other half; a header covers the
  // cases where a crawler sees a redirect or a non-HTML response.
  if (isPrivate) {
    response.headers.set("x-robots-tag", "noindex, nofollow, noarchive, nosnippet");
    response.headers.set("cache-control", "no-store, max-age=0, must-revalidate");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except Next's own static output and common static files.
     * Note the deliberate absence of an auth-specific matcher: headers should
     * be on every HTML response, and the private-route check reads `pathname`
     * rather than relying on the matcher to scope it.
     */
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
