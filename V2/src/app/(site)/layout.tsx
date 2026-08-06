import { SiteFooter } from "@/components/shell/SiteFooter";
import { SiteHeader } from "@/components/shell/SiteHeader";

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
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
