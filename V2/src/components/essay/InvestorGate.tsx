"use client";

/**
 * The gate.
 *
 * Honest about what it is: this keeps raise terms off the public web and out of
 * search results, and it stops a buyer stumbling into fundraising material. It
 * is not a security boundary, and the code does not pretend otherwise — the
 * passcode is compared in the browser, so anyone determined enough to read the
 * bundle can get past it.
 *
 * That trade is deliberate. The alternative is a server, a session and a user
 * table for a page five people will read, and the material behind it is a
 * pitch, not a secret. What actually protects it is `noindex` on the route:
 * the realistic risk was never a determined attacker, it was Google indexing
 * the SAFE terms and a customer finding them.
 *
 * The other path is the one most people will use — request access by email,
 * which opens their mail client with the subject filled in and tells us who is
 * asking. That is worth more than the passcode.
 */
import { useEffect, useState } from "react";
import { CONTACT } from "@/lib/contact";

/** Shared on a call. Not a secret; see the note above. */
const PASSCODE = "provable";
const STORAGE_KEY = "cool.investors.unlocked";

export function InvestorGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);

  // Remember across reloads so a reader who came back does not re-enter it
  // mid-conversation. Read in an effect, not during render, or the server HTML
  // and the first client render disagree and React discards the tree.
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === "1") setUnlocked(true);
    } catch {
      /* storage disabled — the gate simply asks again */
    }
    setReady(true);
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (value.trim().toLowerCase() === PASSCODE) {
      setUnlocked(true);
      setWrong(false);
      try {
        window.sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* nothing to do; they stay unlocked for this render */
      }
      return;
    }
    setWrong(true);
  };

  // Render nothing until the stored answer is known. Flashing the gate at
  // someone who already unlocked it reads as broken.
  if (!ready) return null;
  if (unlocked) return <>{children}</>;

  return (
    <section id="gate">
      <div className="wrap" style={{ maxWidth: "460px" }}>
        <h1 className="opener">Investors</h1>
        <p className="body">
          The raise, the use of funds, the detailed roadmap and named validation
          sit behind this. Ask us for the passcode, or request access and
          we&rsquo;ll come back to you.
        </p>

        <form onSubmit={submit} style={{ marginTop: "var(--s4)" }}>
          <label htmlFor="passcode" className="tiny" style={{ display: "block", marginBottom: "6px" }}>
            Passcode
          </label>
          <input
            id="passcode"
            type="password"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setWrong(false);
            }}
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
            <p className="tiny" style={{ color: "#f85149" }}>
              That is not it. Ask us on the call.
            </p>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "var(--s2)" }}>
            Enter
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
