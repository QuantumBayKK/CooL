import { AutoBreadcrumbs } from "@/components/shell/AutoBreadcrumbs";
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
      <SiteHeader />
      {/* Derived from the pathname and mounted once, so a renamed route cannot
          leave a stale trail behind on a page nobody thought to update.
          Suppresses itself on the homepage and the full-bleed surfaces. */}
      <AutoBreadcrumbs />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      {/* Below `lg` only, after 620px of scroll, and never over the footer.
          It excludes itself from the evidence surfaces and the private rooms —
          see the component. */}
      <StickyMobileCta />
    </div>
  );
}
