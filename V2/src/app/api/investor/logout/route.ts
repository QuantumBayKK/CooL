import { NextResponse } from "next/server";

import { getInvestorSession } from "@/lib/auth/portal";
import { clearSessionCookie } from "@/lib/auth/session";
import { db, portalConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sign out.
 *
 * POST rather than GET, so a `<img src="/api/investor/logout">` on another site
 * cannot sign the investor out. Combined with the `sameSite: strict` cookie
 * this makes CSRF-logout impossible rather than merely inconvenient.
 *
 * The server-side row is revoked as well as the cookie cleared. Clearing only
 * the cookie would leave a live session row whose token is still valid if the
 * cookie was ever captured — "sign out" has to mean the credential is dead, not
 * that this browser forgot it.
 */
export async function POST() {
  if (!portalConfigured()) {
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  }

  const session = await getInvestorSession();

  if (session) {
    const now = new Date().toISOString();
    await db()
      .from("investor_sessions")
      .update({ revoked_at: now })
      .eq("id", session.sessionId);

    await db().from("audit_log").insert({
      action: "session.revoked",
      code_id: session.codeId,
      session_id: session.sessionId,
      subject: "investor-signout",
      ip_prefix: session.ctx.ipPrefix,
      country: session.ctx.country,
      user_agent: session.ctx.userAgent,
    });
  }

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
