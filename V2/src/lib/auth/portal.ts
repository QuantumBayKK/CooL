import "server-only";

import { cache } from "react";

import { requestContext, type RequestContext } from "@/lib/auth/request";
import { hashToken, readSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/supabase/server";
import { toBytea } from "@/lib/auth/codes";

/**
 * The one function every protected page calls.
 *
 * Validating on every request rather than trusting the cookie is the whole
 * point of the two-half session: a revoked code, an expired session or a
 * deleted row takes effect on the next navigation, not in eight hours when the
 * JWT happens to expire.
 *
 * Wrapped in React's `cache` so a page that renders a layout, a header and
 * three server components performs ONE database round trip per request instead
 * of five. The cache is per-request and per-render — it cannot leak one
 * visitor's session into another's, which is the failure mode a module-level
 * cache would have.
 */

export interface InvestorSession {
  sessionId: string;
  codeId: string;
  email: string | null;
  expiresAt: string;
  ctx: RequestContext;
}

export const getInvestorSession = cache(
  async (): Promise<InvestorSession | null> => {
    const claims = await readSessionCookie();
    if (!claims) return null;

    const ctx = await requestContext();

    const { data, error } = await db()
      .from("investor_sessions")
      .select("id, code_id, email, expires_at, revoked_at, token_hash")
      .eq("id", claims.sid)
      .maybeSingle();

    if (error || !data) return null;
    if (data.revoked_at) return null;
    if (new Date(data.expires_at) <= new Date()) return null;

    // The cookie's token must hash to the stored digest. Without this check the
    // session id alone would be a bearer credential, and session ids appear in
    // the audit log — which is read by admins, and would then be a login.
    const expected = toBytea(hashToken(claims.tok));
    if (data.token_hash !== expected) return null;

    return {
      sessionId: data.id,
      codeId: data.code_id,
      email: data.email,
      expiresAt: data.expires_at,
      ctx,
    };
  },
);

/**
 * Record an access.
 *
 * Deliberately not awaited by callers on the render path — an audit write must
 * never be able to fail a page the investor is entitled to see. It is awaited
 * inside so errors are caught here rather than surfacing as an unhandled
 * rejection, and a failure is logged to the server console where it will be
 * noticed, not swallowed.
 */
export async function recordAccess(
  session: InvestorSession,
  action: "page.view" | "asset.download",
  subject: string,
  detail: Record<string, unknown> = {},
): Promise<void> {
  try {
    await db().from("audit_log").insert({
      action,
      code_id: session.codeId,
      session_id: session.sessionId,
      subject,
      ip_prefix: session.ctx.ipPrefix,
      country: session.ctx.country,
      user_agent: session.ctx.userAgent,
      detail,
    });

    // Touch last_seen so the admin's "last active" column means something.
    await db()
      .from("investor_sessions")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", session.sessionId);
  } catch (err) {
    console.error("[audit] failed to record access", { action, subject, err });
  }
}
