"use client";

/**
 * The gate, as the reader sees it. Enforcement lives elsewhere, on purpose.
 *
 * This component is now ONLY a form. It takes no children and it knows no
 * secret. That is the whole change: the previous version received the protected
 * sections as `children` and decided in the browser whether to render them,
 * which meant React serialised every one of them into the RSC payload of the
 * HTML regardless — the raise terms and the five named validators were in the
 * response body of an ungated request. Hiding a thing in the browser is not
 * withholding it.
 *
 * The passcode is compared in `app/investors/gate-action.ts` against
 * `INVESTOR_PASSCODE`, on the server, and the material is rendered by the page
 * only after `hasInvestorAccess()` says so. So there is nothing here to defeat:
 * reading this file, or the bundle it compiles into, tells you nothing you
 * could not have learned by looking at the door.
 *
 * The UX is deliberately unchanged from the version this replaces — same
 * heading, same sentence, same passcode field, same "Request access" mailto.
 * Only enforcement moved. The email path is still the one most readers use, and
 * it is still worth more than the passcode: it tells us who is asking.
 */
import { useActionState } from "react";
import { CONTACT } from "@/lib/contact";
import { unlockInvestorAccess } from "@/app/investors/gate-action";
import { GATE_INITIAL } from "@/app/investors/gate-state";

export function InvestorGate({ next = "/investors" }: { next?: string }) {
  const [state, formAction, pending] = useActionState(
    unlockInvestorAccess,
    GATE_INITIAL,
  );
  const wrong = state.error !== "";

  return (
    <section id="gate">
      <div className="wrap" style={{ maxWidth: "460px" }}>
        <h1 className="opener">Investors</h1>
        <p className="body">
          The raise, the use of funds, the detailed roadmap and named validation
          sit behind this. Ask us for the passcode, or request access and
          we&rsquo;ll come back to you.
        </p>

        <form action={formAction} style={{ marginTop: "var(--s4)" }}>
          <input type="hidden" name="next" value={next} />
          <label htmlFor="passcode" className="tiny" style={{ display: "block", marginBottom: "6px" }}>
            Passcode
          </label>
          <input
            id="passcode"
            name="passcode"
            type="password"
            autoComplete="off"
            style={{
              width: "100%",
              minHeight: "48px",
              borderRadius: "12px",
              border: `1px solid ${wrong ? "#f85149" : "#33436f"}`,
              background: "rgba(255,255,255,0.03)",
              color: "#e9edf5",
              padding: "0 14px",
              fontSize: "17px",
              textAlign: "center",
            }}
          />
          {wrong && (
            <p className="tiny" style={{ color: "#f85149" }} role="alert">
              {state.error}
            </p>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={pending}
            style={{ width: "100%", marginTop: "var(--s2)" }}
          >
            {pending ? "Checking…" : "Enter"}
          </button>
        </form>

        <a
          className="btn btn-ghost"
          style={{ width: "100%", marginTop: "var(--s1)" }}
          href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(
            "CooL — investor access request",
          )}&body=${encodeURIComponent(
            "Hello,\n\nI'd like access to the CooL investor material.\n\nName:\nFund / company:\n\nThanks,",
          )}`}
        >
          Request access
        </a>
      </div>
    </section>
  );
}
