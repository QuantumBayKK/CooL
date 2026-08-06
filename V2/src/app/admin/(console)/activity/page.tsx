import { Eyebrow, StatusBadge } from "@/components/ui/primitives";
import { db, portalConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Investor activity" };

interface SessionRow {
  id: string;
  code_id: string;
  email: string | null;
  ip_prefix: string | null;
  country: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  revoked_at: string | null;
  invite_codes: { code_hint: string; label: string } | null;
}

/**
 * Who has been in, from where, and what they did.
 *
 * Device and browser are derived from the user-agent string at render time
 * rather than stored as separate columns. Storing a parsed device profile would
 * be building a fingerprint database; deriving a coarse label for display keeps
 * the audit useful without the stored artefact.
 */
export default async function AdminActivityPage() {
  if (!portalConfigured()) {
    return (
      <p className="border border-warn/30 bg-warn-wash p-5 text-sm text-ink">
        Supabase is not configured.
      </p>
    );
  }

  const { data } = await db()
    .from("investor_sessions")
    .select(
      "id, code_id, email, ip_prefix, country, user_agent, created_at, last_seen_at, expires_at, revoked_at, invite_codes(code_hint, label)",
    )
    .order("last_seen_at", { ascending: false })
    .limit(100);

  const sessions = (data ?? []) as unknown as SessionRow[];

  // Downloads per session, so the table can show what each visit actually took.
  const { data: downloadRows } = await db()
    .from("audit_log")
    .select("session_id")
    .eq("action", "asset.download");

  const downloads = new Map<string, number>();
  for (const row of (downloadRows ?? []) as { session_id: string | null }[]) {
    if (row.session_id) {
      downloads.set(row.session_id, (downloads.get(row.session_id) ?? 0) + 1);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Eyebrow>Admin</Eyebrow>
        <h1 className="mt-3 text-h1">Investor activity</h1>
        <p className="mt-2 max-w-[64ch] text-sm text-ink-muted">
          IP addresses are stored truncated to /24 or /48 — enough to notice a
          code being used from two networks, not enough to identify a household.
          Country comes from the edge and is blank in local development.
        </p>
      </div>

      {sessions.length === 0 ? (
        <p className="border border-line bg-canvas p-5 text-sm text-ink-muted">
          No sessions yet.
        </p>
      ) : (
        <div data-scroll className="overflow-x-auto border border-line bg-canvas">
          <table className="w-full min-w-[62rem] text-sm">
            <thead>
              <tr className="border-b border-line-strong text-left">
                {[
                  "Code",
                  "Email",
                  "Country",
                  "Network",
                  "Device",
                  "Downloads",
                  "Last seen",
                  "State",
                ].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-label uppercase text-ink-subtle">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const live =
                  !s.revoked_at && new Date(s.expires_at) > new Date();
                return (
                  <tr key={s.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-mono text-ink">
                      {s.invite_codes?.code_hint ?? "—"}
                      {s.invite_codes?.label && (
                        <span className="ml-2 font-sans text-xs text-ink-subtle">
                          {s.invite_codes.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{s.email ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">{s.country ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                      {s.ip_prefix ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {describeAgent(s.user_agent)}
                    </td>
                    <td className="px-4 py-3 text-ink-muted" data-numeric>
                      {downloads.get(s.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-ink-muted" data-numeric>
                      {new Date(s.last_seen_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={live ? "ok" : "neutral"}>
                        {s.revoked_at ? "revoked" : live ? "live" : "ended"}
                      </StatusBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * A coarse "Chrome on macOS" from a user-agent string.
 *
 * Order matters: Edge and Opera both claim Chrome, and Chrome claims Safari, so
 * the most specific brand has to be tested first or everything reports as
 * Safari.
 */
function describeAgent(ua: string | null): string {
  if (!ua) return "—";

  const browser =
    /Edg\//.test(ua) ? "Edge"
    : /OPR\//.test(ua) ? "Opera"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari"
    : "Browser";

  const os =
    /Windows NT/.test(ua) ? "Windows"
    : /iPhone|iPad/.test(ua) ? "iOS"
    : /Mac OS X/.test(ua) ? "macOS"
    : /Android/.test(ua) ? "Android"
    : /Linux/.test(ua) ? "Linux"
    : "";

  return os ? `${browser} · ${os}` : browser;
}
