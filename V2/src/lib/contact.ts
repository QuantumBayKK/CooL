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

/** E.164, e.g. `+919876543210`. Empty until a real line is answered. */
const PHONE_E164 = "";

/** How it should read on screen, e.g. `+91 98765 43210`. */
const PHONE_DISPLAY = "";

export const CONTACT = {
  email: "northwindcipher@gmail.com",
  /** Cal.com — one tap from a phone, no email-app detour. */
  booking: "https://cal.com/coolnwc",
  phone: PHONE_E164,
  phoneDisplay: PHONE_DISPLAY || PHONE_E164,
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
export const HAS_PHONE = CONTACT.phone.length > 0;

/** `tel:` href, or null when there is no number to call. */
export const TEL_HREF = HAS_PHONE ? `tel:${CONTACT.phone}` : null;

export const MAILTO = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
  "CooL — enquiry",
)}`;

/** The investor-specific mail, kept distinct so the two intents stay separate. */
export const INVESTOR_MAILTO = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
  "CooL — Pre-seed investment (₹1 Cr iSAFE)",
)}`;
