import { NextResponse } from "next/server";
import { z } from "zod";

import { hashCode, normaliseCode, toBytea } from "@/lib/auth/codes";
import { rateBucket, requestContext } from "@/lib/auth/request";
import {
  mintToken,
  SESSION_TTL_SECONDS,
  setSessionCookie,
} from "@/lib/auth/session";
import { db, portalConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
// Never cached, never statically analysed into a prerender. This route mints
// credentials; a cached response here would be a catastrophic bug.
export const dynamic = "force-dynamic";

const Body = z.object({
  code: z.string().min(1).max(64),
  // Optional because only email-bound codes require it. Validated as an email
  // when present so a malformed value is rejected before it reaches Postgres.
  email: z.string().email().max(254).optional().or(z.literal("")),
});

/**
 * Redeem an invite code.
 *
 * Three properties this route is built around:
 *
 * 1. **One generic failure.** Every rejection — bad format, unknown code,
 *    revoked, expired, exhausted, wrong email — returns the same status, the
 *    same body and the same shape. Distinguishing them would let an attacker
 *    enumerate live codes by their error messages, turning a 40-bit search into
 *    an oracle. The real reason is written to the audit log, where the admin
 *    can see it and the attacker cannot.
 *
 * 2. **Rate limited in the database.** See `consume_rate_limit`. An in-process
 *    limiter would reset on every cold start and multiply by instance count.
 *
 * 3. **Atomic redemption.** The check-and-increment happens inside
 *    `redeem_invite_code` under `for update`, so two concurrent requests cannot
 *    both consume the last use of a single-use code.
 */
export async function POST(request: Request) {
  if (!portalConfigured()) {
    return NextResponse.json(
      { ok: false, error: "The investor portal is not configured." },
      { status: 503 },
    );
  }

  const ctx = await requestContext();

  // ── rate limit first, before any parsing work ───────────────────────────
  // 5 attempts per 15 minutes per /24. Against a 40-bit code space this makes
  // an online search hopeless while staying invisible to someone who fat-
  // fingered their code twice.
  const { data: allowed, error: limitError } = await db().rpc(
    "consume_rate_limit",
    { p_bucket: rateBucket("redeem", ctx), p_limit: 5, p_window: "15 minutes" },
  );

  if (limitError) {
    console.error("[redeem] rate limiter unavailable", limitError);
    // Fail CLOSED. A redemption endpoint whose limiter is down is exactly when
    // an attacker wants it open.
    return NextResponse.json(
      { ok: false, error: "Temporarily unavailable. Try again shortly." },
      { status: 503 },
    );
  }

  if (!allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many attempts. Try again in 15 minutes.",
      },
      { status: 429, headers: { "retry-after": "900" } },
    );
  }

  // ── parse ────────────────────────────────────────────────────────────────
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return generic();
  }

  const normalised = normaliseCode(body.code);
  if (!normalised) return generic();

  const email = body.email ? body.email.trim().toLowerCase() : null;

  // ── redeem ───────────────────────────────────────────────────────────────
  const { token, hash } = mintToken();

  const { data, error } = await db().rpc("redeem_invite_code", {
    p_code_hash: toBytea(hashCode(normalised)),
    p_token_hash: toBytea(hash),
    p_email: email,
    p_session_ttl: `${SESSION_TTL_SECONDS} seconds`,
    p_ip_prefix: ctx.ipPrefix,
    p_country: ctx.country,
    p_user_agent: ctx.userAgent,
  });

  if (error) {
    console.error("[redeem] rpc failed", error);
    return NextResponse.json(
      { ok: false, error: "Temporarily unavailable. Try again shortly." },
      { status: 503 },
    );
  }

  // `returns table` gives an array of one row.
  const row = Array.isArray(data) ? data[0] : data;

  if (!row?.ok) return generic();

  await setSessionCookie({ sid: row.session_id, tok: token });

  return NextResponse.json({ ok: true, redirect: "/investor/overview" });
}

/**
 * The single failure response.
 *
 * 401 with a message that names no cause. The 900ms floor is not present: a
 * constant-time response would require padding every success too, and the
 * database round trip already dominates the timing signal. What matters is that
 * the *body* is identical, because that is what a scripted attack reads.
 */
function generic() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "That code is not valid. Check it against your invitation, or contact us for a new one.",
    },
    { status: 401 },
  );
}
