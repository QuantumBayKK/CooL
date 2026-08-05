/**
 * How to reach the company — one source of truth.
 *
 * Every surface that offers a way to get in touch reads from here, so a changed
 * number or a new booking link is a one-line edit rather than a hunt through
 * components. It also means the JSON-LD `ContactPoint` and the visible contact
 * block can never disagree, which is the sort of mismatch that quietly costs a
 * rich result.
 *
 * `phone` is deliberately allowed to be empty, and every consumer is written to
 * degrade rather than to render a placeholder. A demo phone number on a live
 * site is worse than no phone number: it is a promise that rings nowhere, and a
 * buyer who tries it once will not try the email either. Set it when a real
 * line is answered, and the number appears in the contact block, in the sticky
 * bar on phones, and in the structured data at the same moment.
 */

/**
 * The lines that are answered.
 *
 * `tel:` needs E.164 — `+91` and no spaces — or a share sheet on iOS will
 * sometimes dial the wrong thing; the display string is grouped the way an
 * Indian number is read. Both forms are kept rather than derived, because
 * deriving one from the other means encoding grouping rules per country.
 */
export const PHONES = [
  { e164: "+919942867200", display: "+91 99428 67200" },
  { e164: "+919791288350", display: "+91 97912 88350" },
] as const;

export const CONTACT = {
  email: "northwindcipher@gmail.com",
  /** Cal.com — one tap from a phone, no email-app detour. */
  booking: "https://cal.com/coolnwc",
  /** The first line is the one structured data advertises. */
  phone: PHONES[0].e164,
  phoneDisplay: PHONES[0].display,
  /** Registered entity, for the footer and the structured data. */
  company: "Northwind Cipher Pvt. Ltd.",
  city: "Coimbatore",
  country: "IN",
  founders: [
    { name: "Pranauv Shrinaath S", role: "Founder & CEO" },
    { name: "Kailosh Kalimuthu", role: "Co-Founder & CTO" },
  ],
} as const;

/** True when a real number is configured. Nothing renders a fake one. */
export const HAS_PHONE = PHONES.length > 0;

/** `tel:` href for the primary line, or null when there is none. */
export const TEL_HREF = HAS_PHONE ? `tel:${CONTACT.phone}` : null;

export const MAILTO = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
  "CooL — enquiry",
)}`;

/*
 * REMOVED: `INVESTOR_MAILTO`, whose subject line was
 * "CooL — Pre-seed investment (₹1 Cr iSAFE)".
 *
 * Nothing imported it. It was dead code — and dead code that named the round,
 * exported from a module that the public essay, the nav and half the site
 * import for a phone number. Webpack kept the expression rather than shaking it
 * out, so the raise terms were compiled into client chunks on routes that had
 * no business carrying them.
 *
 * Two things made it invisible for a long time. It is URL-encoded in the built
 * output ("%E2%82%B91%20Cr"), and the source spells it "Pre-seed" with a
 * capital P — so a case-sensitive grep for "pre-seed", which is what the first
 * audit ran, sailed straight past it.
 *
 * If an investor-specific mailto is ever needed again, it belongs in
 * content/investors-restricted.ts and reaches the client as a prop from a
 * server component that has verified access. Not here.
 */
