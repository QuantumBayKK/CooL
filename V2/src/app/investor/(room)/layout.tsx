import { redirect } from "next/navigation";

import { RoomNav } from "@/components/investor/RoomNav";
import { getInvestorSession } from "@/lib/auth/portal";
import { portalConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * The authorisation boundary.
 *
 * This is the real check, not the middleware. Middleware only confirms a cookie
 * exists; here the cookie is decrypted, the session row is fetched, the token
 * hash is compared, and revocation and expiry are enforced. A page added under
 * `(room)` tomorrow is protected by existing — nobody has to remember to add it
 * to a matcher.
 *
 * `force-dynamic` matters as much as the check: without it Next would try to
 * prerender these routes at build time, and a prerendered investor page is a
 * static file served to anyone who guesses its URL.
 */
export default async function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!portalConfigured()) redirect("/investor/login");

  const session = await getInvestorSession();
  if (!session) redirect("/investor/login");

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <RoomNav email={session.email} expiresAt={session.expiresAt} />
      <main id="main" className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
