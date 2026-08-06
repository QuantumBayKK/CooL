import type { Metadata } from "next";

import { AssetRow } from "@/components/investor/AssetRow";
import { Eyebrow, StatusBadge } from "@/components/ui/primitives";
import { getInvestorSession, recordAccess } from "@/lib/auth/portal";
import { db } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Data room" };

interface Asset {
  id: string;
  title: string;
  description: string;
  category: string;
  content_type: string;
  size_bytes: number | null;
}

/**
 * The data room.
 *
 * The catalogue is read from `data_room_assets` rather than from a bucket
 * listing. A listing exposes every key to anyone who can list, and a filename
 * cannot carry the metadata a document needs — whether it is currently offered,
 * what it is, or where it sorts.
 *
 * No download URL is rendered here. Each row posts to
 * `/api/investor/asset/[id]`, which re-checks the session, writes the audit
 * entry and only then mints a 60-second signed URL. Putting the URL in the HTML
 * would make it forwardable and would log nothing.
 */
export default async function DataRoomPage() {
  const session = await getInvestorSession();
  if (session) void recordAccess(session, "page.view", "/investor/data-room");

  const { data, error } = await db()
    .from("data_room_assets")
    .select("id, title, description, category, content_type, size_bytes")
    .eq("available", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  const assets = (data ?? []) as Asset[];

  const grouped = assets.reduce<Record<string, Asset[]>>((acc, asset) => {
    (acc[asset.category] ??= []).push(asset);
    return acc;
  }, {});

  return (
    <div className="mx-auto w-full max-w-[56rem] px-5 py-10 sm:px-8 lg:py-14">
      <Eyebrow>Diligence</Eyebrow>
      <h1 className="mt-4 text-h1">Data room</h1>
      <p className="mt-3 max-w-[60ch] text-lead text-ink-muted">
        Documents, downloadable. Every download is recorded against your code —
        who, what, and when.
      </p>

      <div className="mt-6 border border-line bg-surface p-4">
        <StatusBadge status="neutral">How downloads work</StatusBadge>
        <p className="mt-2.5 max-w-[74ch] text-sm text-ink-muted">
          Links are minted per click and expire in 60 seconds, so a URL copied
          out of this page is dead before it can be forwarded. The file itself
          continues downloading past expiry — the signature is checked once, at
          request time.
        </p>
      </div>

      {error && (
        <p className="mt-8 border border-fail/30 bg-fail-wash p-4 text-sm text-fail">
          The catalogue could not be loaded. This is a server-side fault, not a
          permissions one — try again, and tell us if it persists.
        </p>
      )}

      {!error && assets.length === 0 && (
        <div className="mt-8 border border-line bg-surface p-6">
          <h2 className="text-h4">No documents published yet.</h2>
          <p className="mt-2 max-w-[62ch] text-sm text-ink-muted">
            The room is wired and the audit trail is live; nothing has been
            uploaded to it. Documents are added from the admin console, and they
            appear here the moment they are.
          </p>
        </div>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mt-10">
          <h2 className="text-label uppercase text-ink-subtle">{category}</h2>
          <ul className="mt-3 border-t border-line">
            {items.map((asset) => (
              <AssetRow key={asset.id} asset={asset} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
