import { SiteLink } from "@/components/shell/SiteLink";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { Wordmark } from "@/components/shell/Wordmark";
import { adminConfigured, isAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <div className="grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-[24rem]">
        <SiteLink href="/" className="inline-block">
          <Wordmark />
        </SiteLink>

        <h1 className="mt-8 text-h2">Admin</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Issue and revoke invite codes, and read the audit trail.
        </p>

        {adminConfigured() ? (
          <AdminLoginForm className="mt-7" />
        ) : (
          <div className="mt-7 border border-warn/30 bg-warn-wash p-4">
            <p className="text-sm text-ink">Admin access is not configured.</p>
            <p className="mt-1.5 text-xs text-ink-muted">
              Set <code className="font-mono">ADMIN_PASSPHRASE</code> (24
              characters or more) and{" "}
              <code className="font-mono">ADMIN_SESSION_SECRET</code>. They must
              be different values.
            </p>
          </div>
        )}

        <p className="mt-7 text-xs text-ink-subtle">
          Five attempts per hour. Every attempt — successful or not — is written
          to the audit log with a truncated IP.
        </p>
      </div>
    </div>
  );
}
