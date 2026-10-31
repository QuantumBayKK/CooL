import { NextResponse, type NextRequest } from "next/server";

import { communityServer } from "@/lib/community/supabase";
import { safeReturnPath } from "@/lib/community/paths";

/**
 * OAuth return: exchanges the one-time code (PKCE) for a session cookie, then continues to the
 * requested page, or to the welcome steps for someone who has not finished them.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  // Where to go next: the cookie set when sign-in started (or a ?next= from older links).
  const saved = request.cookies.get("cm_next")?.value;
  let fromCookie: string | null = null;
  try { fromCookie = saved ? decodeURIComponent(saved) : null; } catch { /* malformed: ignore */ }
  const next = safeReturnPath(fromCookie ?? url.searchParams.get("next"));
  const done = (res: NextResponse) => { res.cookies.set("cm_next", "", { path: "/community", maxAge: 0 }); return res; };
  const fail = (code: string) => done(NextResponse.redirect(new URL(`/community/login?error=${code}&next=${encodeURIComponent(next)}`, url.origin)));

  const err = url.searchParams.get("error");
  // A banned address is refused when its account would be created; Supabase reports that as a database error.
  if (err) return fail(err === "access_denied" ? "access_denied" : /database error saving new user/i.test(url.searchParams.get("error_description") ?? "") ? "blocked" : "exchange");
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
  const welcomed = profile?.onboarded_at && profile?.guidelines_accepted_at;
  const target = welcomed ? next : `/community/welcome?next=${encodeURIComponent(next)}`;
  return done(NextResponse.redirect(new URL(target, url.origin)));
}
