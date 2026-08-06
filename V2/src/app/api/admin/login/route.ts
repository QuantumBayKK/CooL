import { NextResponse } from "next/server";
import { z } from "zod";

import {
  adminConfigured,
  checkPassphrase,
  setAdminCookie,
} from "@/lib/auth/admin";
import { rateBucket, requestContext } from "@/lib/auth/request";
import { db, portalConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ passphrase: z.string().min(1).max(256) });

/**
 * Admin sign-in.
 *
 * Rate limited harder than investor redemption — 5 attempts per hour rather
 * than per fifteen minutes — because this credential mints invite codes and
 * reads the whole audit trail, and because there is exactly one legitimate user
 * who will not be locked out by a tight limit.
 *
 * Both success and failure are written to the audit log. A failed admin login
 * is the single most interesting event this system can record: nobody
 * mistypes this passphrase five times, so the row means somebody is trying.
 */
export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Admin access is not configured. Set ADMIN_PASSPHRASE (24+ characters) and ADMIN_SESSION_SECRET.",
      },
      { status: 503 },
    );
  }

  const ctx = await requestContext();

  if (portalConfigured()) {
    const { data: allowed, error } = await db().rpc("consume_rate_limit", {
      p_bucket: rateBucket("admin-login", ctx),
      p_limit: 5,
      p_window: "1 hour",
    });

    // Fail closed: an admin endpoint whose limiter is unavailable is exactly
    // when it should stop accepting attempts.
    if (error) {
      return NextResponse.json({ ok: false, error: "Unavailable." }, { status: 503 });
    }
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Try again in an hour." },
        { status: 429, headers: { "retry-after": "3600" } },
      );
    }
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid." }, { status: 400 });
  }

  const ok = checkPassphrase(body.passphrase);

  if (portalConfigured()) {
    await db()
      .from("audit_log")
      .insert({
        action: ok ? "admin.login" : "admin.login.fail",
        subject: "admin-console",
        ip_prefix: ctx.ipPrefix,
        country: ctx.country,
        user_agent: ctx.userAgent,
      });
  }

  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Incorrect passphrase." },
      { status: 401 },
    );
  }

  await setAdminCookie();
  return NextResponse.json({ ok: true, redirect: "/admin" });
}
