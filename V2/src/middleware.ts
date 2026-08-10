import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/cookies";

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
 * ── two script policies, and why ──
 *
 * A nonce-based policy only works on a page Next renders *per request*. Next
 * stamps the nonce onto its own script tags by reading the `x-nonce` request
 * header set below — but a statically prerendered page was generated at build
 * time, long before any nonce existed, so its HTML carries none.
 *
 * That matters because `'strict-dynamic'` makes a browser ignore every host
 * source (`'self'`, `https:`) *and* `'unsafe-inline'`. On a prerendered page
 * the result is a policy that trusts a nonce nothing carries, and the browser
 * blocks every script on the page. This was live: the whole public site —
 * `/`, `/pricing`, `/about`, `/verify` — shipped ~20 blocked scripts per page
 * and never hydrated. No scroll animation, no demo, no mobile menu, no nav
 * dropdowns. Verified again after this change; see the note at the end.
 *
 * So the policy is chosen per response:
 *
 *   dynamic routes (`/investor`, `/admin`)  nonce + `'strict-dynamic'`
 *   everything else (prerendered)           `'self' 'unsafe-inline'`
 *
 * The split is not a climbdown, it is where the two policies are each correct.
 * The strong one stays on exactly the surfaces that hold a session, a token or
 * the data room — the only places an XSS is worth mounting — and those are
 * dynamic precisely *because* they are authenticated, so the two properties
 * travel together rather than by coincidence. The public pages that fall back
 * render no user-supplied content at all: marketing copy, MDX authored in this
 * repo, and evidence the visitor's own browser computed.
 *
 * `'unsafe-inline'` on the fallback is load-bearing rather than lazy — Next's
 * hydration payload arrives as inline `self.__next_f.push(...)` scripts, and
 * without either a nonce or `'unsafe-inline'` the page cannot hydrate at all.
 * A nonce must NOT be added to the fallback: its mere presence is what makes a
 * browser ignore `'unsafe-inline'`, which is the trap this is escaping.
 *
 * If a public route ever needs the strong policy, the fix is to make it
 * dynamic (`export const dynamic = "force-dynamic"`) and add it to
 * `PRIVATE_PREFIXES`-style matching here — not to widen this string.
 *
 * `style-src` allows `'unsafe-inline'` without apology: Next injects inline
 * styles for font loading and for the streaming shell, and there is no nonce
 * path for them. The risk is materially lower than for script — CSS injection
 * cannot execute — and pretending otherwise by shipping a policy that breaks
 * the site would be worse.
 */
function contentSecurityPolicy(
  nonce: string,
  dev: boolean,
  /** True only where Next renders per request and can stamp the nonce. */
  nonceable: boolean,
): string {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  // 'unsafe-eval' in development only — Turbopack's HMR needs it, and it must
  // never reach production.
  const evalSrc = dev ? " 'unsafe-eval'" : "";

  const scriptSrc = nonceable
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'${evalSrc} https:`
    : `script-src 'self' 'unsafe-inline'${evalSrc}`;

  return [
    `default-src 'self'`,
    scriptSrc,
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

  // `isPrivate` doubles as "Next renders this per request". Every route under
  // /investor and /admin is dynamic because it is authenticated; everything
  // else in the app is prerendered. See the note on `contentSecurityPolicy`.
  response.headers.set(
    "content-security-policy",
    contentSecurityPolicy(nonce, dev, isPrivate),
  );
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
