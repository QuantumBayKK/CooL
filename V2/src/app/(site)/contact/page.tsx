import type { Metadata } from "next";
import { Calendar, Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/marketing/ContactForm";
import {
  Container,
  Eyebrow,
  Section,
  SectionHeader,
} from "@/components/ui/primitives";
import { CONTACT, HAS_PHONE, PHONES } from "@/lib/contact";
import { RESPONSE } from "@/content/marketing";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to the people who built CooL. Pilots, security questions, pricing, or a vulnerability report.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <Section bordered={false}>
      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-20">
          <div>
            <SectionHeader
              as="h1"
              eyebrow="Contact"
              title="Talk to the people who wrote it."
              lead="Not a sales team. If you ask a technical question you will get a technical answer, including when the answer is that we have not built it yet."
            />

            {/* The response-time promise, stated before the form rather than
                after it. The question "how long until someone replies?" is
                what a reader weighs while deciding whether to type anything,
                so answering it afterwards answers it too late. Same string as
                the thank-you page and the FAQ — one constant, so the promise
                cannot say different things in different places. */}
            <div className="mt-8 border-l-2 border-accent bg-accent-wash/40 py-3 pl-4">
              <p className="text-label uppercase text-ink-subtle">
                Response time
              </p>
              <p className="mt-1.5 max-w-[54ch] text-sm text-ink">
                {RESPONSE.long}
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-px bg-line">
              <a
                href={`mailto:${CONTACT.email}`}
                className="flex items-start gap-4 bg-canvas py-4 transition-colors duration-[--duration-state] hover:bg-surface"
              >
                <Mail className="mt-0.5 size-4 shrink-0 text-ink-subtle" strokeWidth={1.75} />
                <span>
                  <span className="block text-label uppercase text-ink-subtle">
                    Email
                  </span>
                  <span className="mt-1 block text-sm text-ink">
                    {CONTACT.email}
                  </span>
                </span>
              </a>

              <a
                href={CONTACT.booking}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-start gap-4 bg-canvas py-4 transition-colors duration-[--duration-state] hover:bg-surface"
              >
                <Calendar className="mt-0.5 size-4 shrink-0 text-ink-subtle" strokeWidth={1.75} />
                <span>
                  <span className="block text-label uppercase text-ink-subtle">
                    Book a call
                  </span>
                  <span className="mt-1 block text-sm text-ink">
                    Thirty minutes, no deck unless you want one
                  </span>
                </span>
              </a>

              {/* Rendered only when a real line is answered — see lib/contact.ts.
                  A number that rings nowhere costs more than no number. */}
              {HAS_PHONE &&
                PHONES.map((phone) => (
                  <a
                    key={phone.e164}
                    href={`tel:${phone.e164}`}
                    className="flex items-start gap-4 bg-canvas py-4 transition-colors duration-[--duration-state] hover:bg-surface"
                  >
                    <Phone className="mt-0.5 size-4 shrink-0 text-ink-subtle" strokeWidth={1.75} />
                    <span>
                      <span className="block text-label uppercase text-ink-subtle">
                        Phone
                      </span>
                      <span className="mt-1 block text-sm text-ink">
                        {phone.display}
                      </span>
                    </span>
                  </a>
                ))}

              <div className="flex items-start gap-4 bg-canvas py-4">
                <MapPin className="mt-0.5 size-4 shrink-0 text-ink-subtle" strokeWidth={1.75} />
                <span>
                  <span className="block text-label uppercase text-ink-subtle">
                    Entity
                  </span>
                  <span className="mt-1 block text-sm text-ink">
                    {CONTACT.company}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-muted">
                    {CONTACT.city}
                  </span>
                </span>
              </div>
            </div>

            <div className="mt-10">
              <Eyebrow>Security reports</Eyebrow>
              <p className="mt-3 max-w-[60ch] text-sm text-ink-muted">
                Email us before disclosing publicly and we will credit you. We
                do not run a paid bounty and are not going to imply we do. Use
                the form with the security topic selected, or email directly.
              </p>
            </div>
          </div>

          <div className="lg:pt-14">
            <ContactForm />
          </div>
        </div>
      </Container>
    </Section>
  );
}
