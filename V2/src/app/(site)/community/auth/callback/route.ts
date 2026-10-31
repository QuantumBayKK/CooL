import { NextResponse, type NextRequest } from "next/server";

import { communityServer } from "@/lib/community/supabase";
import { safeReturnPath } from "@/lib/community/paths";

/**
 * OAuth return: exchanges the one-time code (PKCE) for a session cookie, then continues to the
 * requested page, or to the welcome steps for someone who has not finished them.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeReturnPath(url.searchParams.get("next"));
  const fail = (code: string) => NextResponse.redirect(new URL(`/community/login?error=${code}&next=${encodeURIComponent(next)}`, url.origin));

  if (url.searchParams.get("error")) return fail(url.searchParams.get("error") === "access_denied" ? "access_denied" : "exchange");
  const code = url.searchParams.get("code");
  const supabase = await communityServer();
  if (!code || !supabase) return fail("exchange");

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return fail("exchange");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at, guidelines_accepted_at")
    .eq("id", data.user.id)
    .maybeSingle();
  const done = profile?.onboarded_at && profile?.guidelines_accepted_at;
  const target = done ? next : `/community/welcome?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(new URL(target, url.origin));
}
