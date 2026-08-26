import Link from "next/link";
import type { ComponentProps } from "react";

import { isStandalone } from "@/lib/site";

/**
 * A link that knows which of our own pages React does not serve.
 *
 * Most of this site is the app router, but three of its addresses are not:
 * `/` and `/pricing` are the marketing site and `/studio` is the CooL
 * Recorder, all hand-written HTML in `public/` reached through rewrites. See
 * `STANDALONE` in `lib/site.ts` for why that distinction has to be visible to
 * the React side at all.
 *
 * Three cases, and the middle one is the reason this component exists:
 *
 *   external    — another origin. Plain `<a>`, opens in a new tab, carries
 *                 `rel="noreferrer noopener"`.
 *   standalone  — our origin, but not a route. Plain `<a>`, **same tab**, no
 *                 `rel`. Treating it like an external link would be wrong in a
 *                 way readers notice: clicking "Pricing" in your own site's
 *                 header should not spawn a tab.
 *   everything  — a real route. `next/link`, with prefetching and client
 *     else       navigation intact, exactly as before.
 *
 * Use it anywhere a link's destination comes from `NAV`/`FOOTER` or might
 * otherwise be one of the static surfaces. For a link that is definitely to a
 * route — `/docs/quickstart`, say — plain `next/link` is still correct and
 * this adds nothing.
 */
export function SiteLink({
  href,
  children,
  ...rest
}: Omit<ComponentProps<"a">, "href"> & { href: string }) {
  const external = href.startsWith("http");

  if (external || isStandalone(href)) {
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}
