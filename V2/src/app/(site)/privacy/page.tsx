import type { Metadata } from "next";
import Link from "next/link";

import { Container, Eyebrow } from "@/components/ui/primitives";
import { SITE } from "@/lib/site";
import { RESPONSE } from "@/content/marketing";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What Northwind Cipher collects, why, how long it is kept, and who it is shared with. Short, specific, and written to be checked rather than skimmed.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy policy — CooL",
    description:
      "What we collect, why, how long we keep it, and who it goes to. No dark patterns, no third-party advertising.",
    url: "/privacy",
  },
};

/**
 * The privacy policy.
 *
 * Written as specifics rather than as boilerplate, on the principle that a
 * company selling tamper-evident evidence cannot credibly ship a privacy page
 * that says "we may share your data with selected partners". Every statement
 * here is one an engineer could check against the code in this repo, and the
 * three that are checkable are linked to the file that implements them.
 *
 * IMPORTANT — this is an honest engineering description of what the software
 * does. It has not been reviewed by a lawyer, and it names two jurisdictions
 * (India's DPDP Act and the GDPR) whose formal requirements — a named grievance
 * officer, a stated lawful basis per purpose, a data-retention schedule — go
 * beyond what a developer can responsibly draft. That gap is stated on the page
 * itself rather than papered over with confident-sounding text.
 */

const LAST_UPDATED = "11 August 2026";

export default function PrivacyPage() {
  return (
    <>
      {/* No manual breadcrumb — `AutoBreadcrumbs` in the site layout derives
          it from the pathname for every page. */}
      <Container>
        <div className="py-10 lg:py-14">
          <Eyebrow>Legal</Eyebrow>
          <h1 className="mt-4 max-w-[20ch] text-display">Privacy policy</h1>
          <p className="mt-5 max-w-prose text-lead text-ink-muted">
            What {SITE.company} collects, why, how long it is kept, and who it
            is shared with. Last updated {LAST_UPDATED}.
          </p>

          <div className="prose-cool mt-12">
            <h2>The short version</h2>
            <p>
              We collect the minimum needed to answer your enquiry and to run
              the investor room. We do not sell data, we do not run advertising
              or advertising trackers, and nothing you type into the demo or the
              verifier on this site is transmitted anywhere — it is computed in
              your browser and stays there.
            </p>

            <h2>What runs in your browser and never leaves it</h2>
            <p>
              The{" "}
              <Link href="/demo">live demo</Link>, the{" "}
              <Link href="/verify">verifier</Link>, the{" "}
              <Link href="/pipeline">pipeline page</Link> and the{" "}
              <Link href="/studio">studio</Link> execute real cryptography
              locally. Keys are generated in the page, receipts are produced in
              the page, and verification is performed in the page. There is no
              server involved and no upload step. During a verification run the
              page replaces <code>fetch</code>, <code>XMLHttpRequest</code>,{" "}
              <code>WebSocket</code>, <code>EventSource</code> and{" "}
              <code>sendBeacon</code> with counting wrappers and prints the
              count — the zero you see is a measurement, not a claim.
            </p>

            <h2>What we collect, and why</h2>
            <table>
              <thead>
                <tr>
                  <th>What</th>
                  <th>Why</th>
                  <th>Kept for</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    Name, email and message you submit to{" "}
                    <Link href="/contact">the contact form</Link>
                  </td>
                  <td>To reply to you. Nothing else.</td>
                  <td>Until the conversation ends, then 24 months</td>
                </tr>
                <tr>
                  <td>Invitation code, and the email you redeem it with</td>
                  <td>
                    To grant and audit access to the investor room, and to
                    revoke a code that has been shared onward
                  </td>
                  <td>Life of the raise, then deleted</td>
                </tr>
                <tr>
                  <td>Investor-room access log (which section, when)</td>
                  <td>
                    So we can tell an investor who else has their link, and
                    detect a code circulating beyond its holder
                  </td>
                  <td>Life of the raise, then deleted</td>
                </tr>
                <tr>
                  <td>A session cookie, on the private routes only</td>
                  <td>To keep you signed in to the investor room or admin</td>
                  <td>Until it expires or you sign out</td>
                </tr>
                <tr>
                  <td>Aggregate page analytics, if enabled</td>
                  <td>
                    To see which pages get read. IP addresses are anonymised and
                    no advertising or cross-site profile is built
                  </td>
                  <td>14 months</td>
                </tr>
              </tbody>
            </table>

            <h2>Cookies</h2>
            <p>
              The public site sets no cookies. The investor room and admin
              console set one signed, <code>HttpOnly</code>, same-site session
              cookie, which is strictly necessary to keep you signed in and
              carries no tracking identifier. If analytics is enabled it is
              configured without advertising features and with IP anonymisation.
            </p>

            <h2>Who else touches your data</h2>
            <ul>
              <li>
                <strong>Vercel</strong> — hosting and edge delivery. Sees
                request metadata such as IP and user agent, as any host must.
              </li>
              <li>
                <strong>Supabase</strong> — the database behind the investor
                room. Holds invite codes, redemptions and the access log.
              </li>
              <li>
                <strong>Google Analytics</strong> — only if a measurement ID is
                configured for this deployment, and only in the anonymised
                configuration described above.
              </li>
            </ul>
            <p>
              That is the complete list. We do not sell or rent personal data,
              and we do not share it with advertisers or data brokers.
            </p>

            <h2>Your rights</h2>
            <p>
              You can ask us what we hold about you, ask for it to be corrected,
              or ask for it to be deleted, and we will do it. Email{" "}
              <a href="mailto:info.quantumbay@gmail.com">
                info.quantumbay@gmail.com
              </a>{" "}
              and we will respond within {RESPONSE.window}. You do not need to
              give a reason, and deleting your data will not affect anything
              else you can access here.
            </p>

            <h2>Security</h2>
            <p>
              The private routes are behind authentication and row-level
              security in the database, the site sends a strict
              Content-Security-Policy and HSTS, and the session cookie is
              signed and <code>HttpOnly</code>. See the{" "}
              <Link href="/security">security model</Link> for the threat model
              and, more usefully, for what we explicitly cannot protect against.
            </p>

            <h2>What this document is not</h2>
            <p>
              This is an accurate engineering description of what the software
              does, written by the people who wrote the software. It has not
              been reviewed by a lawyer. If you need a formal DPDP or GDPR
              instrument — a named grievance officer, a per-purpose lawful
              basis, a processor agreement — ask and we will produce one rather
              than pretend this page already is one. Saying so is more useful to
              you than a confident page that quietly is not.
            </p>

            <h2>Contact</h2>
            <p>
              {SITE.company}. Written enquiries and data requests to{" "}
              <a href="mailto:info.quantumbay@gmail.com">
                info.quantumbay@gmail.com
              </a>
              , or through <Link href="/contact">the contact form</Link>.
            </p>
          </div>
        </div>
      </Container>
    </>
  );
}
