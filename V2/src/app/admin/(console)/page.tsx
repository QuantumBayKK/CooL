import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, Eyebrow, StatusBadge } from "@/components/ui/primitives";
import { db, portalConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Admin overview.
 *
 * Counts only, and each one is a live query rather than a cached metric. An
 * admin dashboard whose numbers lag is worse than one with no numbers: it makes
 * "3 active codes" a thing you cannot act on without re-checking elsewhere.
 */
export default async function AdminOverviewPage() {
  if (!portalConfigured()) {
    return (
      <div className="border border-warn/30 bg-warn-wash p-5">
        <p className="text-sm text-ink">
          Supabase is not configured, so there is nothing to show.
        </p>
      </div>
    );
  }

  const now = new Date().toISOString();

  const [codes, activeCodes, sessions, downloads, failures] = await Promise.all([
    db().from("invite_codes").select("id", { count: "exact", head: true }),
    db()
      .from("invite_codes")
      .select("id", { count: "exact", head: true })
      .is("revoked_at", null)
      .gt("expires_at", now),
    db()
      .from("investor_sessions")
      .select("id", { count: "exact", head: true })
      .is("revoked_at", null)
      .gt("expires_at", now),
    db()
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("action", "asset.download"),
    db()
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .in("action", ["code.redeem.fail", "admin.login.fail"]),
  ]);

  const stats = [
    { label: "Codes issued", value: codes.count ?? 0, href: "/admin/codes" },
    { label: "Currently redeemable", value: activeCodes.count ?? 0, href: "/admin/codes" },
    { label: "Live sessions", value: sessions.count ?? 0, href: "/admin/activity" },
    { label: "Downloads", value: downloads.count ?? 0, href: "/admin/activity" },
  ];

  const failCount = failures.count ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Admin</Eyebrow>
          <h1 className="mt-3 text-h1">Overview</h1>
        </div>
        <Button asChild>
          <Link href="/admin/codes">Issue a code</Link>
        </Button>
      </div>

      <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-canvas p-5 transition-colors duration-[--duration-state] hover:bg-raised"
          >
            <p className="text-label uppercase text-ink-subtle">{stat.label}</p>
            <p className="mt-2 text-h1 text-ink" data-numeric>
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Failed attempts get their own card rather than a fifth stat tile.
          A number that means "someone may be attacking you" should not sit in
          a row of neutral counts where the eye skims past it. */}
      <Card
        className={
          failCount > 0
            ? "border-warn/40 bg-warn-wash p-5"
            : "p-5"
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <StatusBadge status={failCount > 0 ? "warn" : "ok"}>
                {failCount > 0 ? "Review" : "Clear"}
              </StatusBadge>
              <p className="text-sm text-ink">
                {failCount} failed redemption or admin sign-in{" "}
                {failCount === 1 ? "attempt" : "attempts"} recorded
              </p>
            </div>
            <p className="mt-1.5 max-w-[70ch] text-xs text-ink-muted">
              Nobody mistypes an admin passphrase five times. A cluster of these
              from one prefix is worth reading properly.
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin/audit">Open the audit trail</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
