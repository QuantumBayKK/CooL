import { Eyebrow, StatusBadge, type Status } from "@/components/ui/primitives";
import { db, portalConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit trail" };

interface AuditRow {
  id: number;
  at: string;
  action: string;
  subject: string | null;
  ip_prefix: string | null;
  country: string | null;
  detail: Record<string, unknown>;
  invite_codes: { code_hint: string; label: string } | null;
}

/**
 * The append-only trail.
 *
 * There is no filter UI and no delete affordance, deliberately. A filter that
 * hides rows teaches the reader to trust a view rather than the record, and a
 * delete button on an append-only table would be a lie the database would
 * reject anyway — the trigger raises on both UPDATE and DELETE.
 *
 * Newest first, 200 rows. Pagination is the obvious next thing; it is absent
 * rather than half-built.
 */
const TONE: Record<string, Status> = {
  "code.created": "neutral",
  "code.revoked": "warn",
  "code.redeem.success": "ok",
  "code.redeem.fail": "fail",
  "session.created": "ok",
  "session.revoked": "neutral",
  "session.expired": "neutral",
  "page.view": "neutral",
  "asset.download": "accent",
  "admin.login": "ok",
  "admin.login.fail": "fail",
};

export default async function AdminAuditPage() {
  if (!portalConfigured()) {
    return (
      <p className="border border-warn/30 bg-warn-wash p-5 text-sm text-ink">
        Supabase is not configured.
      </p>
    );
  }

  const { data } = await db()
    .from("audit_log")
    .select("id, at, action, subject, ip_prefix, country, detail, invite_codes(code_hint, label)")
    .order("at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as AuditRow[];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Eyebrow>Admin</Eyebrow>
        <h1 className="mt-3 text-h1">Audit trail</h1>
        <p className="mt-2 max-w-[64ch] text-sm text-ink-muted">
          Append-only, enforced by a database trigger rather than by policy
          alone — an UPDATE or DELETE against this table raises, whoever issues
          it. Showing the 200 most recent entries.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="border border-line bg-canvas p-5 text-sm text-ink-muted">
          Nothing recorded yet.
        </p>
      ) : (
        <div data-scroll className="overflow-x-auto border border-line bg-canvas">
          <table className="w-full min-w-[58rem] text-sm">
            <thead>
              <tr className="border-b border-line-strong text-left">
                {["When", "Action", "Code", "Subject", "Network", "Detail"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-label uppercase text-ink-subtle">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 text-ink-muted" data-numeric>
                    {new Date(row.at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={TONE[row.action] ?? "neutral"}>
                      {row.action}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-muted">
                    {row.invite_codes?.code_hint ?? "—"}
                  </td>
                  <td className="max-w-[18rem] truncate px-4 py-2.5 text-ink-muted">
                    {row.subject ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-muted">
                    {row.ip_prefix ?? "—"}
                    {row.country ? ` · ${row.country}` : ""}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-subtle">
                    {Object.keys(row.detail ?? {}).length
                      ? JSON.stringify(row.detail)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
