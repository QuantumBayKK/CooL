import { CodeManager } from "@/components/admin/CodeManager";
import { Eyebrow } from "@/components/ui/primitives";
import { db, portalConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Invite codes" };

export interface CodeRow {
  id: string;
  code_hint: string;
  label: string;
  notes: string;
  email: string | null;
  max_uses: number;
  used_count: number;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}

export default async function AdminCodesPage() {
  if (!portalConfigured()) {
    return (
      <p className="border border-warn/30 bg-warn-wash p-5 text-sm text-ink">
        Supabase is not configured.
      </p>
    );
  }

  const { data } = await db()
    .from("invite_codes")
    .select(
      "id, code_hint, label, notes, email, max_uses, used_count, expires_at, revoked_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Eyebrow>Admin</Eyebrow>
        <h1 className="mt-3 text-h1">Invite codes</h1>
        <p className="mt-2 max-w-[64ch] text-sm text-ink-muted">
          A code is shown once, at creation. Only its SHA-256 and a
          four-character hint are stored, so a lost code cannot be recovered —
          it has to be reissued. Revoking a code also kills every session it
          created.
        </p>
      </div>

      <CodeManager initial={(data ?? []) as CodeRow[]} />
    </div>
  );
}
