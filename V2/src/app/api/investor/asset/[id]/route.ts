import { NextResponse } from "next/server";
import { z } from "zod";

import { getInvestorSession, recordAccess } from "@/lib/auth/portal";
import { rateBucket } from "@/lib/auth/request";
import { db, portalConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 60 seconds. Long enough to start a transfer, short enough to be useless if forwarded. */
const SIGNED_URL_TTL = 60;

const Id = z.uuid();

/**
 * Mint a signed download URL for one data-room asset.
 *
 * POST, not GET. Three reasons, and each one is load-bearing:
 *
 *   · A GET would be prefetchable — a browser or a link scanner walking the
 *     page would mint URLs and write audit entries for downloads nobody made,
 *     which corrupts the one record that has to be trustworthy.
 *   · A GET URL lands in browser history and in referrer headers.
 *   · Combined with the `sameSite: strict` cookie, POST means another site
 *     cannot trigger a download by embedding a link.
 *
 * The order below matters: authorise, then audit, then mint. Minting before
 * auditing would leave a window where a crash produces a live URL with no
 * record of who asked for it.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!portalConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const session = await getInvestorSession();
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id } = await params;
  const parsed = Id.safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // A generous limit — it exists to stop a script enumerating and hoovering the
  // whole room, not to slow down someone reading it.
  const { data: allowed, error: limitError } = await db().rpc(
    "consume_rate_limit",
    {
      p_bucket: rateBucket(`download:${session.sessionId}`, session.ctx),
      p_limit: 60,
      p_window: "10 minutes",
    },
  );

  if (limitError || !allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many downloads. Pause a moment." },
      { status: limitError ? 503 : 429 },
    );
  }

  const { data: asset } = await db()
    .from("data_room_assets")
    .select("id, storage_key, title, available")
    .eq("id", parsed.data)
    .maybeSingle();

  // A withdrawn document is treated as absent rather than as forbidden: the
  // distinction would confirm the document exists to someone holding a stale id.
  if (!asset || !asset.available) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await recordAccess(session, "asset.download", asset.storage_key, {
    asset_id: asset.id,
    title: asset.title,
  });

  const { data: signed, error } = await db()
    .storage.from("data-room")
    .createSignedUrl(asset.storage_key, SIGNED_URL_TTL, { download: true });

  if (error || !signed) {
    console.error("[asset] failed to sign", { key: asset.storage_key, error });
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  return NextResponse.json(
    { ok: true, url: signed.signedUrl, expiresIn: SIGNED_URL_TTL },
    { headers: { "cache-control": "no-store" } },
  );
}
