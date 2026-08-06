import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminSignOut } from "@/components/admin/AdminSignOut";
import { Wordmark } from "@/components/shell/Wordmark";
import { isAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/codes", label: "Invite codes" },
  { href: "/admin/activity", label: "Investor activity" },
  { href: "/admin/audit", label: "Audit trail" },
] as const;

/**
 * The admin authorisation boundary.
 *
 * Same shape as the investor room: middleware only checks the cookie exists,
 * and this layout does the real validation. Every page under `(console)` is
 * protected by living here.
 */
export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-canvas">
        <div className="container-page">
          <div className="flex h-16 items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Wordmark />
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-ink-subtle">
                admin
              </span>
            </div>
            <AdminSignOut />
          </div>
          <nav aria-label="Admin" className="-mb-px flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className="whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm text-ink-muted transition-colors duration-[--duration-state] hover:border-line-strong hover:text-ink"
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1 bg-surface">
        <div className="container-page py-10">{children}</div>
      </main>
    </div>
  );
}
