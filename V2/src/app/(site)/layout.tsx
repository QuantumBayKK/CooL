import { AutoBreadcrumbs } from "@/components/shell/AutoBreadcrumbs";
import { HideOnFullBleed } from "@/components/shell/ChromeGate";
import { PageFade } from "@/components/shell/PageFade";
import { RouteProgress } from "@/components/shell/RouteProgress";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { StickyMobileCta } from "@/components/shell/StickyMobileCta";

/**
 * The public shell.
 *
 * Header and footer live here rather than in the root layout so that the
 * investor portal and the admin console — which are in sibling route groups —
 * cannot accidentally inherit public navigation. A "Pricing" link inside the
 * data room would be a small bug; a "Sign out" link that is actually the public
 * header's would be a real one.
 *
 * There is no page-transition wrapper at this level. Next's App Router already
 * streams route segments, and wrapping the whole tree in AnimatePresence would
 * force every route to be a client component and defeat that.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Covers the latency of a route change; the fade below covers the swap
          at the end of it. Together a navigation never shows a blank frame or
          a hard cut. Both are CSS on `--ease-nav` — see globals.css. */}
      <RouteProgress />
      <SiteHeader />
      {/* Derived from the pathname and mounted once, so a renamed route cannot
          leave a stale trail behind on a page nobody thought to update.
          Suppresses itself on the homepage and the full-bleed surfaces. */}
      <AutoBreadcrumbs />
      <main id="main" className="flex-1">
        {/* `children` passes through as a prop, so every page below this stays
            a Server Component. See the note in `PageFade`. */}
        <PageFade>{children}</PageFade>
      </main>
      {/* Suppressed on the full-bleed surfaces. A four-column marketing footer
          hanging off the bottom of a viewport-sized instrument turns it into a
          document that scrolls, which is exactly what the walkthrough is built
          not to be. */}
      <HideOnFullBleed>
        <SiteFooter />
      </HideOnFullBleed>
      {/* Below `lg` only, after 620px of scroll, and never over the footer.
          It excludes itself from the evidence surfaces and the private rooms —
          see the component. */}
      <StickyMobileCta />
    </div>
  );
}
