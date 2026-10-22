import Link from "next/link";

import { BOOKING_URL, NPM_URL, REPO_URL } from "@/content/claims";

import { RecorderMark, Wordmark } from "./RecorderMark";

const COLS: readonly { title: string; links: readonly { href: string; label: string; ext?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/developers#receipt", label: "Receipts" },
      { href: "/verify", label: "Verifier" },
      { href: "/evidence#attestation", label: "Attestation" },
      { href: "/evidence#log", label: "Transparency log" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/evidence", label: "Evidence" },
      { href: "/limits", label: "Limits" },
      { href: "/security", label: "Security" },
      { href: "/security/readiness", label: "Readiness" },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: "/developers", label: "Quickstart" },
      { href: "/docs", label: "Documentation" },
      { href: "/studio", label: "Studio" },
      { href: REPO_URL, label: "GitHub", ext: true },
      { href: NPM_URL, label: "npm", ext: true },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/team", label: "About" },
      { href: "/design-partners", label: "Design partners" },
      { href: BOOKING_URL, label: "Book a demo", ext: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: `${REPO_URL}/blob/main/LICENSE`, label: "Licence", ext: true },
      { href: `${REPO_URL}/blob/main/SECURITY.md`, label: "Disclosure policy", ext: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="f-foot">
      <div className="f-wrap">
        <div className="f-foot__cols">
          <div className="f-stack" style={{ ["--stack" as string]: "16px" }}>
            <Link href="/" className="f-brand" aria-label="CooL by Northwind Cipher — home">
              <RecorderMark className="f-brand__mark" />
              <Wordmark />
            </Link>
            <p className="f-body f-small" style={{ maxWidth: "34ch" }}>
              Verifiable records of every change to your AI. Built by Northwind Cipher Pvt. Ltd., Coimbatore, India.
            </p>
            <span className="f-foot__badge">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#76B900" d="M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.398 0-.787-.062-1.158-.185v-4.346c1.528.185 1.837.857 2.747 2.385l2.04-1.714s-1.492-1.952-4-1.952a6.016 6.016 0 0 0-.796.035m0-4.735v2.138l.424-.027c5.45-.185 9.01 4.47 9.01 4.47s-4.08 4.964-8.33 4.964c-.37 0-.733-.035-1.095-.097v1.325c.3.035.61.062.91.062 3.957 0 6.82-2.023 9.593-4.408.459.371 2.34 1.263 2.73 1.652-2.633 2.208-8.772 3.984-12.253 3.984-.335 0-.653-.018-.971-.053v1.864H24V4.063zm0 10.326v1.131c-3.657-.654-4.673-4.46-4.673-4.46s1.758-1.944 4.673-2.262v1.237H8.94c-1.528-.186-2.73 1.245-2.73 1.245s.68 2.412 2.739 3.11M2.456 10.9s2.164-3.197 6.5-3.533V6.201C4.153 6.59 0 10.653 0 10.653s2.35 6.802 8.948 7.42v-1.237c-4.84-.6-6.492-5.936-6.492-5.936z" />
              </svg>
              NVIDIA Inception member
            </span>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <h2>{c.title}</h2>
              <ul>
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.ext ? (
                      <a href={l.href} target="_blank" rel="noopener">
                        {l.label} ↗
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
          <p>© 2026 Northwind Cipher Pvt. Ltd. All rights reserved.</p>
          <p>cool-nwc is source-available under the Business Source License 1.1.</p>
        </div>
      </div>
    </footer>
  );
}
