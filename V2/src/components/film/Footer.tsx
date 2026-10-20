import Link from "next/link";

import { BOOKING_URL, NPM_URL, REPO_URL, claim } from "@/content/claims";

import { LocalClock } from "./LocalClock";
import { RecorderMark } from "./RecorderMark";

const COLS: readonly { title: string; links: readonly { href: string; label: string; ext?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/developers#receipt", label: "Receipts" },
      { href: "/verify", label: "Verifier" },
      { href: "/evidence#attestation", label: "Attestation" },
      { href: "/evidence#log", label: "Log" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Evidence",
    links: [
      { href: "/evidence", label: "Verification domains" },
      { href: "/limits", label: "Limits" },
      { href: "/security", label: "Security" },
      { href: "/security/readiness", label: "Readiness ladder" },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: "/developers", label: "Quickstart" },
      { href: "/docs", label: "Docs" },
      { href: "/studio", label: "Studio" },
      { href: REPO_URL, label: "GitHub ↗", ext: true },
      { href: NPM_URL, label: "npm ↗", ext: true },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/team", label: "Team" },
      { href: "/design-partners", label: "Design partners" },
      { href: BOOKING_URL, label: "Book a call ↗", ext: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: `${REPO_URL}/blob/main/LICENSE`, label: "Licence ↗", ext: true },
      { href: `${REPO_URL}/blob/main/SECURITY.md`, label: "Disclosure policy ↗", ext: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="f-foot">
      <div className="f-wrap">
        <div className="f-foot__cols">
          <div className="f-stack" style={{ ["--stack" as string]: "16px" }}>
            <Link href="/" className="f-brand" aria-label="Northwind Cipher · CooL — home">
              <RecorderMark className="f-brand__mark" />
              <span className="f-brand__word" aria-hidden="true">
                CooL
              </span>
            </Link>
            <p className="f-body f-small">
              The flight recorder for AI change. Built by Northwind Cipher Pvt. Ltd., Coimbatore, India.
            </p>
            <p className="f-label">{claim("nvidiaInception")}</p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <h2 className="f-label">[ {c.title} ]</h2>
              <ul>
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.ext ? (
                      <a href={l.href} target="_blank" rel="noopener">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href}>{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="f-foot__legal">
          <p className="f-label">© 2026 Northwind Cipher Pvt. Ltd. · {claim("licence")}</p>
          <LocalClock />
        </div>
      </div>
      <span className="f-foot__giant" aria-hidden="true">
        COOL
      </span>
    </footer>
  );
}
