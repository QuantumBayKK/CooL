import Link from "next/link";

import { SiteLink } from "@/components/shell/SiteLink";
import { redirect } from "next/navigation";

import { RedeemForm } from "@/components/investor/RedeemForm";
import { Wordmark } from "@/components/shell/Wordmark";
import { getInvestorSession } from "@/lib/auth/portal";
import { portalConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Invite-code entry.
 *
 * Nothing on this page states what lies behind it beyond "investor materials".
 * A login screen that lists the documents it protects tells an attacker exactly
 * what a code is worth, and tells a crawler what to look for.
 */
export default async function InvestorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Already signed in — no reason to make someone redeem a second time.
  if (portalConfigured() && (await getInvestorSession())) {
    redirect("/investor/overview");
  }

  const { next } = await searchParams;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ── the form ──────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between p-6 sm:p-10">
        <SiteLink href="/" className="w-fit">
          <Wordmark />
        </SiteLink>

        <div className="mx-auto w-full max-w-[26rem] py-12">
          <h1 className="text-h2">Investor access</h1>
          <p className="mt-3 text-sm text-ink-muted">
            Enter the code from your invitation. If your code was issued to a
            specific address, enter that address too.
          </p>

          {portalConfigured() ? (
            <RedeemForm next={next} className="mt-8" />
          ) : (
            <div className="mt-8 border border-warn/30 bg-warn-wash p-4">
              <p className="text-sm text-ink">
                The portal is not configured on this deployment.
              </p>
              <p className="mt-1.5 text-xs text-ink-muted">
                Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
                <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> and{" "}
                <code className="font-mono">INVESTOR_SESSION_SECRET</code>. See{" "}
                <code className="font-mono">.env.example</code>.
              </p>
            </div>
          )}

          <p className="mt-8 text-xs text-ink-subtle">
            Codes are single-use unless stated otherwise and expire on the date
            in your invitation. Attempts are rate limited and every redemption
            is logged. If your code has expired,{" "}
            <Link
              href="/contact"
              className="text-ink underline underline-offset-4"
            >
              ask us for a new one
            </Link>
            .
          </p>
        </div>

        <p className="text-xs text-ink-subtle">
          <SiteLink
            href="/"
            className="underline underline-offset-4 hover:text-ink"
          >
            Back to the public site
          </SiteLink>
        </p>
      </div>

      {/* ── the panel ─────────────────────────────────────────────────────
          Deliberately content-free. It carries the brand and nothing that
          would tell an unauthenticated visitor what is inside. */}
      <div className="hidden border-l border-line bg-surface lg:block">
        <div className="flex h-full flex-col justify-end p-10">
          <blockquote className="max-w-[34ch]">
            <p className="text-h3 text-ink">
              Evidence that only its author can check is not evidence.
            </p>
            <footer className="mt-4 text-sm text-ink-subtle">
              The design principle the whole product follows from.
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
