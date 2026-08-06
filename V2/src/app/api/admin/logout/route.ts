import { NextResponse } from "next/server";

import { clearAdminCookie } from "@/lib/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST only — a GET would be triggerable cross-site. */
export async function POST() {
  await clearAdminCookie();
  return NextResponse.json({ ok: true });
}
