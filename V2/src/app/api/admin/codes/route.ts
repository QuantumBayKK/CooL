import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdmin } from "@/lib/auth/admin";
import { codeHint, generateCode, hashCode, toBytea } from "@/lib/auth/codes";
import { requestContext } from "@/lib/auth/request";
import { db, portalConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Create = z.object({
  label: z.string().max(120).default(""),
  notes: z.string().max(2000).default(""),
  email: z.string().email().max(254).optional().or(z.literal("")),
  maxUses: z.number().int().min(1).max(100).default(1),
  // Days from now. Capped at a year: an invite code with no practical expiry is
  // a password, and it will outlive the conversation that justified it.
  expiresInDays: z.number().int().min(1).max(365).default(30),
});

/**
 * Mint an invite code.
 *
 * The plaintext code is returned in this response and NEVER again. Only its
 * SHA-256 and a four-character hint are stored, which means:
 *
 *   · a database dump does not yield working codes;
 *   · we genuinely cannot recover a code an investor has lost, and have to
 *     issue a new one — which is the correct behaviour, and is why the admin UI
 *     makes the one-time display unmissable.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!portalConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let input: z.infer<typeof Create>;
  try {
    input = Create.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof z.ZodError ? err.issues[0]?.message : "Invalid input." },
      { status: 400 },
    );
  }

  const code = generateCode();
  const expiresAt = new Date(
    Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await db()
    .from("invite_codes")
    .insert({
      code_hash: toBytea(hashCode(code)),
      code_hint: codeHint(code),
      label: input.label,
      notes: input.notes,
      email: input.email || null,
      max_uses: input.maxUses,
      expires_at: expiresAt,
      created_by: "admin",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[admin] code creation failed", error);
    return NextResponse.json({ ok: false, error: "Could not create the code." }, { status: 503 });
  }

  const ctx = await requestContext();
  await db().from("audit_log").insert({
    action: "code.created",
    code_id: data.id,
    subject: input.label || "unlabelled",
    ip_prefix: ctx.ipPrefix,
    country: ctx.country,
    user_agent: ctx.userAgent,
    detail: { max_uses: input.maxUses, expires_at: expiresAt, bound: Boolean(input.email) },
  });

  return NextResponse.json(
    { ok: true, id: data.id, code, expiresAt },
    { headers: { "cache-control": "no-store" } },
  );
}

/** Revoke. Immediate, and it also kills every session the code created. */
export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!portalConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const id = z.uuid().safeParse(new URL(request.url).searchParams.get("id"));
  if (!id.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { error } = await db()
    .from("invite_codes")
    .update({ revoked_at: now, revoked_by: "admin" })
    .eq("id", id.data);

  if (error) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  /*
   * Revoking the code must revoke its live sessions too.
   *
   * Without this, revocation only stops NEW redemptions — anyone already inside
   * keeps their eight-hour session, which is precisely the window that matters
   * when you are revoking because a code leaked.
   */
  const { data: killed } = await db()
    .from("investor_sessions")
    .update({ revoked_at: now })
    .eq("code_id", id.data)
    .is("revoked_at", null)
    .select("id");

  const ctx = await requestContext();
  await db().from("audit_log").insert({
    action: "code.revoked",
    code_id: id.data,
    subject: "admin-console",
    ip_prefix: ctx.ipPrefix,
    country: ctx.country,
    user_agent: ctx.userAgent,
    detail: { sessions_revoked: killed?.length ?? 0 },
  });

  return NextResponse.json({ ok: true, sessionsRevoked: killed?.length ?? 0 });
}
