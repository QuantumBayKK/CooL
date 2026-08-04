/**
 * The landing page, in sections.
 *
 * Server components, deliberately. Everything here is text a crawler and a
 * reader both need, so none of it is behind a `use client` boundary or a
 * scroll-triggered reveal — the previous homepage animated its content in from
 * `opacity: 0`, which reads beautifully and means a crawler (and anyone whose
 * JS fails) sees an empty page. The only client code on this route is the thumb
 * bar, which is chrome rather than content.
 *
 * The whole file is written phone-first: single column by default, two columns
 * only where a wider screen genuinely helps, tap targets at 48px, and type
 * sized for arm's length rather than for a 27-inch monitor. Desktop is a
 * widening of this, not a separate design.
 */
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { CONTACT, HAS_PHONE, MAILTO, TEL_HREF } from "@/lib/contact";

/* ── shared ───────────────────────────────────────────────────────────── */

function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      {...(id ? { id } : {})}
      className={`mx-auto w-full max-w-5xl px-5 py-14 sm:px-6 md:py-20 ${className}`}
    >
      {children}
    </section>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] tracking-[0.18em] text-verify uppercase">
      {children}
    </p>
  );
}

/** Section heading. One `h2` each — the page has exactly one `h1`, in the hero. */
function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-3 text-[clamp(1.7rem,7vw,2.6rem)] leading-[1.12] font-semibold tracking-[-0.02em] text-balance text-ink">
      {children}
    </h2>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 max-w-[52ch] text-[16.5px] leading-relaxed text-pretty text-fog sm:text-[17.5px]">
      {children}
    </p>
  );
}

/* ── hero ─────────────────────────────────────────────────────────────── */

export function Hero() {
  return (
    <header className="mx-auto w-full max-w-5xl px-5 pt-24 pb-12 sm:px-6 md:pt-32 md:pb-20">
      <p className="font-mono text-[11px] tracking-[0.18em] text-verify uppercase">
        The black box for AI
      </p>

      {/* The one h1 on the page. Written as a claim about the reader's Monday,
          not about our architecture — nobody searches for an evidence plane. */}
      <h1 className="mt-4 text-[clamp(2.3rem,10.5vw,4.6rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance text-ink">
        Every AI change, documented and provable.{" "}
        <span className="text-mist">Without anyone writing it up.</span>
      </h1>

      <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-pretty text-fog sm:text-[19px]">
        Your teams change prompts, models and permissions every day. Each one is
        supposed to be written up, approved and filed for the auditor. CooL does
        all of it automatically — and seals it so it can be proved years later.
      </p>

      {/* The actions. `id` is what the thumb bar watches to know it can appear. */}
      <div id="hero-actions" className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/demo"
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-verify px-6 text-[16px] font-semibold text-[#06121f] transition-[filter] hover:brightness-95 active:brightness-90"
        >
          See it work
          <ArrowRight className="size-[18px]" strokeWidth={2.4} />
        </Link>
        <a
          href={CONTACT.booking}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-line-strong px-6 text-[16px] font-medium text-ink transition-colors hover:border-verify/50 hover:bg-panel"
        >
          <CalendarClock className="size-[18px]" strokeWidth={2} />
          Book a call
        </a>
      </div>

      <p className="mt-4 text-[13.5px] leading-relaxed text-mist">
        A live demo — real cryptography, running in your browser. No signup.
      </p>

      {/* Contact, on the first screen, because the ask was for it to be here.
          The number renders only when one is configured. */}
      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 text-[14px]">
        {HAS_PHONE && TEL_HREF && (
          <a
            href={TEL_HREF}
            className="inline-flex min-h-[44px] items-center gap-2 font-medium text-ink transition-colors hover:text-verify"
          >
            <Phone className="size-4 text-verify" strokeWidth={2} />
            {CONTACT.phoneDisplay}
          </a>
        )}
        <a
          href={MAILTO}
          className="inline-flex min-h-[44px] items-center gap-2 text-fog transition-colors hover:text-verify"
        >
          <Mail className="size-4 text-mist" strokeWidth={2} />
          {CONTACT.email}
        </a>
      </div>
    </header>
  );
}

/* ── problem ──────────────────────────────────────────────────────────── */

const COSTS = [
  { figure: "3–6 weeks", label: "to assemble evidence for one AI audit" },
  { figure: "40+", label: "AI changes a week in a mid-size estate" },
  { figure: "€35m", label: "or 7% of turnover — the EU AI Act ceiling" },
];

export function Problem() {
  return (
    <Section id="problem">
      <Kicker>The problem</Kicker>
      <H2>The work is invisible until someone asks for it.</H2>
      <Lead>
        Changing a prompt takes four seconds. Proving who changed it, why it was
        approved and what it was before takes a fortnight — and it is only ever
        needed on the worst possible day, when a regulator, a customer or a court
        is already asking.
      </Lead>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {COSTS.map((cost) => (
          <div key={cost.label} className="rounded-xl border border-line bg-panel p-4">
            <div className="text-[26px] leading-none font-semibold text-ink">
              {cost.figure}
            </div>
            <div className="mt-2 text-[13.5px] leading-snug text-mist">{cost.label}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ── how ──────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    n: "01",
    title: "Install once",
    body: "One config object and a post-commit hook. An engineer does it in an hour and never touches it again.",
  },
  {
    n: "02",
    title: "Change your AI as normal",
    body: "Edit a prompt, bump a model, widen an agent's permissions. Nobody opens a ticket or fills in a form.",
  },
  {
    n: "03",
    title: "The evidence is already there",
    body: "The record, the approval, the audit trail and the cryptographic proof exist before the laptop closes — and an auditor can verify them offline, without us.",
  },
];

export function How() {
  return (
    <Section id="how">
      <Kicker>How it works</Kicker>
      <H2>Three steps, and you only do the first one.</H2>

      <ol className="mt-8 flex flex-col gap-3">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="flex gap-4 rounded-xl border border-line bg-panel p-5"
          >
            <span className="font-mono text-[13px] text-verify">{step.n}</span>
            <div className="min-w-0">
              <h3 className="text-[16.5px] font-semibold text-ink">{step.title}</h3>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-mist">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <Link
        href="/demo"
        className="mt-6 inline-flex min-h-[48px] items-center gap-2 text-[15.5px] font-medium text-verify hover:underline"
      >
        Watch it happen from one save
        <ArrowRight className="size-4" strokeWidth={2.4} />
      </Link>
    </Section>
  );
}

/* ── proof ────────────────────────────────────────────────────────────── */

const PROOF = [
  "Hybrid post-quantum signatures — ML-DSA-65 and Ed25519, both must hold",
  "An RFC 6962 transparency log, so a deleted record changes the tree head",
  "Sealed inside a hardware TEE, with keys derived from the running image",
  "Verifiable offline, by anyone, with no CooL code and no account",
];

export function Proof() {
  return (
    <Section id="proof">
      <Kicker>Why it holds up</Kicker>
      <H2>Evidence you don&rsquo;t have to be trusted on.</H2>
      <Lead>
        A log your vendor can edit is not evidence. Every record CooL produces is
        signed where it is created and checkable by someone who trusts neither
        you nor us — which is the only version of this that survives a regulator.
      </Lead>

      <ul className="mt-8 flex flex-col gap-2.5">
        {PROOF.map((item) => (
          <li key={item} className="flex gap-3">
            <Check className="mt-[3px] size-[17px] shrink-0 text-live" strokeWidth={2.6} />
            <span className="text-[15px] leading-relaxed text-fog">{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7 rounded-xl border border-line bg-panel p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-[18px] text-live" strokeWidth={2.2} />
          <span className="text-[15px] font-semibold text-ink">Check it yourself</span>
        </div>
        <p className="mt-2 text-[14.5px] leading-relaxed text-mist">
          The demo runs the real cryptography in your browser, then lets you try
          to forge a record and watch the verifier reject it.
        </p>
        <Link
          href="/demo"
          className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-verify hover:underline"
        >
          Open the live demo
          <ArrowRight className="size-4" strokeWidth={2.4} />
        </Link>
      </div>
    </Section>
  );
}

/* ── pricing ──────────────────────────────────────────────────────────── */

const TIERS = [
  { name: "Free", price: "₹0", body: "The SDK. A developer installs it in an hour — no seat count, no expiry." },
  { name: "Team", price: "Monthly", body: "The console, the audit export and the change register. The paperwork stops for that team." },
  { name: "Company", price: "Annual", body: "Every AI change in the business runs through it, with policy set centrally." },
  { name: "Regulated", price: "Bespoke", body: "Private and on-prem deployment inside your own confidential VMs." },
];

export function Pricing() {
  return (
    <Section id="pricing">
      <Kicker>Pricing</Kicker>
      <H2>Free to adopt. Paid to scale.</H2>
      <Lead>
        The SDK is free and always will be — it is how we get in the door, and it
        is the part an engineer has to trust. You pay when it stops being one
        team&rsquo;s tool and starts being how the company works.
      </Lead>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {TIERS.map((tier) => (
          <div key={tier.name} className="rounded-xl border border-line bg-panel p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[16.5px] font-semibold text-ink">{tier.name}</h3>
              <span className="font-mono text-[13px] text-verify">{tier.price}</span>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-mist">{tier.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ── faq ──────────────────────────────────────────────────────────────── */

/** Also emitted as FAQPage structured data — kept in one place so they agree. */
export const FAQ = [
  {
    q: "Do we have to change how our engineers work?",
    a: "No. They change prompts, models and permissions exactly as they do now. CooL captures the change from the commit — there is no form, no ticket and no extra step to forget.",
  },
  {
    q: "How long does it take to install?",
    a: "About an hour. One config object and a post-commit hook. There is no signing key to manage, because the key is derived inside the enclave from the running image.",
  },
  {
    q: "Can CooL forge or alter our records?",
    a: "No. Signing keys are derived inside your enclave from its own measurement, so we never hold them. Every receipt is verifiable offline by a third party who trusts neither of us.",
  },
  {
    q: "Which regulations does this cover?",
    a: "The evidence maps to EU AI Act Articles 12, 14 and 15, India's DPDP Rules 2025, ISO/IEC 42001 and RBI digital-lending model governance. The export prints the mapping per obligation.",
  },
  {
    q: "Does our data leave our infrastructure?",
    a: "No. Records carry salted commitments, not your prompts or outputs. The plane can run entirely inside your own confidential VMs, on-premise.",
  },
  {
    q: "What if we stop paying?",
    a: "Your evidence stays yours and stays verifiable. The verifier is open source and the receipt format is published, so nothing you have already sealed depends on us being around.",
  },
];

export function Faq() {
  return (
    <Section id="faq">
      <Kicker>Questions</Kicker>
      <H2>The things buyers actually ask.</H2>

      {/* Padding lives on the summary, not on the details. It is the summary
          that gets tapped, and with the padding one level up it was a 23px
          target — half what a thumb needs, on the one control this section
          has. */}
      <div className="mt-8 flex flex-col gap-2.5">
        {FAQ.map((item) => (
          <details
            key={item.q}
            className="group overflow-hidden rounded-xl border border-line bg-panel open:border-line-strong"
          >
            <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15.5px] font-medium text-ink marker:hidden [&::-webkit-details-marker]:hidden">
              {item.q}
              <span
                aria-hidden
                className="shrink-0 text-[22px] leading-none text-mist transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="px-5 pb-4 text-[14.5px] leading-relaxed text-mist">{item.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

/* ── contact ──────────────────────────────────────────────────────────── */

export function Contact() {
  return (
    <Section id="contact">
      <div className="rounded-2xl border border-verify/30 bg-panel p-6 sm:p-8">
        <Kicker>Talk to us</Kicker>
        <H2>See it on your own AI.</H2>
        <p className="mt-4 max-w-[46ch] text-[16px] leading-relaxed text-fog">
          Twenty minutes. We&rsquo;ll show the demo, then point it at one of your
          own repositories so you can see your changes sealed rather than ours.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/demo"
            className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-verify px-6 text-[16px] font-semibold text-[#06121f] hover:brightness-95"
          >
            See it work
            <ArrowRight className="size-[18px]" strokeWidth={2.4} />
          </Link>
          <a
            href={CONTACT.booking}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl border border-line-strong px-6 text-[16px] font-medium text-ink hover:border-verify/50"
          >
            <CalendarClock className="size-[18px]" strokeWidth={2} />
            Book a call
          </a>
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-line pt-6 text-[15px]">
          {HAS_PHONE && TEL_HREF && (
            <a
              href={TEL_HREF}
              className="inline-flex min-h-[44px] items-center gap-3 font-medium text-ink hover:text-verify"
            >
              <Phone className="size-[18px] text-verify" strokeWidth={2} />
              {CONTACT.phoneDisplay}
            </a>
          )}
          <a
            href={MAILTO}
            className="inline-flex min-h-[44px] items-center gap-3 text-fog hover:text-verify"
          >
            <Mail className="size-[18px] text-mist" strokeWidth={2} />
            {CONTACT.email}
          </a>
        </div>

        <p className="mt-5 text-[13px] leading-relaxed text-mist">
          {CONTACT.company} · {CONTACT.city}, India ·{" "}
          {CONTACT.founders.map((f) => `${f.name}, ${f.role}`).join(" · ")}
        </p>
      </div>
    </Section>
  );
}

/* ── footer ───────────────────────────────────────────────────────────── */

const FOOTER_LINKS = [
  { href: "/demo", label: "Live demo" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/studio", label: "Studio" },
  { href: "/dashboard", label: "Console" },
  { href: "/sdk", label: "SDK" },
  { href: "/why", label: "Why CooL" },
  { href: "/deck", label: "Deck" },
  { href: "/investors", label: "Investors" },
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6">
        <nav aria-label="Site" className="flex flex-wrap gap-x-6 gap-y-3">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-[44px] items-center text-[15px] text-mist transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="mt-8 text-[12.5px] leading-relaxed text-mist">
          © {new Date().getFullYear()} {CONTACT.company}. CooL and the evidence
          format are Apache-2.0. Hardware attestation is reported as simulated
          until it runs in a confidential VM — the verifier never rounds it up.
        </p>
      </div>
    </footer>
  );
}
