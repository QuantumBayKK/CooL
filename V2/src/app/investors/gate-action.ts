"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, issuedToken, verifyPasscode } from "@/lib/investor-access";
// Imported, never re-exported: a "use server" module may export async functions
// and nothing else. See gate-state.ts for the incident that taught us.
import type { GateState } from "./gate-state";

/**
 * Unlocking, as a server action.
 *
 * The passcode is compared here and nowhere else. The old gate compared it in
 * the browser against a string compiled into the bundle, which meant the
 * "secret" shipped to everyone who loaded the page — and, worse, that the
 * material it guarded shipped too. Both facts are gone: the comparison happens
 * on the server against `INVESTOR_PASSCODE`, and the material is only rendered
 * on a request that already carries a valid cookie.
 *
 * On success this redirects rather than returning. The page reads the cookie
 * during its own server render, so the unlocked view has to come from a fresh
 * request — returning "ok" would leave the reader looking at the gate they just
 * opened.
 */

/** Only ever redirect within the gated area — never to an attacker's URL. */
function safeDestination(raw: FormDataEntryValue | null): string {
  const value = typeof raw === "string" ? raw : "";
  return value === "/investors/diligence" ? value : "/investors";
}

export async function unlockInvestorAccess(
  _previous: GateState,
  formData: FormData,
): Promise<GateState> {
  const entered = formData.get("passcode");
  const destination = safeDestination(formData.get("next"));

  if (typeof entered !== "string" || entered.trim() === "") {
    return { error: "Enter the passcode, or request access below." };
  }

  if (!verifyPasscode(entered)) {
    // One message for "wrong passcode" and for "no passcode configured on this
    // deployment". Distinguishing them would tell a stranger whether the door
    // has a lock fitted, which is not information worth giving away.
    return { error: "That is not it. Ask us on the call." };
  }

  const token = issuedToken();
  if (token === null) return { error: "That is not it. Ask us on the call." };

  (await cookies()).set(ACCESS_COOKIE, token, {
    httpOnly: true, // JS on the page can never read it, so an XSS cannot lift it
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/investors", // the only place it means anything
    // No maxAge: a session cookie. Closing the browser closes the door, which
    // matches how this is actually used — a passcode read out during a call.
  });

  redirect(destination);
}
