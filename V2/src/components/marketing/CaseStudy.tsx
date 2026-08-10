import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Eyebrow, StatusBadge } from "@/components/ui/primitives";
import { CASE_STUDY } from "@/content/marketing";

/**
 * The worked example.
 *
 * A conventional case study would name a bank, quote a VP and print a
 * percentage. This one cannot, because there is no customer yet — so it does
 * the useful half honestly: a concrete regulated workflow, the specific way it
 * fails today, and what the pipeline on this page produces instead.
 *
 * The "not a customer deployment" badge is the first thing in the section and
 * is repeated in the figures' footnote. That is not excessive caution: a
 * reader skimming a section shaped like a case study will assume it is one,
 * and an assumption the layout invites has to be corrected by the layout.
 * Every figure carries its `basis` — where the number comes from and how to
 * check it — for the same reason.
 */
export function CaseStudy() {
  return (
    <section id="case-study" className="section-y border-t border-line bg-surface">
      <Container>
        <div className="flex flex-col gap-4">
          <Eyebrow>Case study</Eyebrow>
          <StatusBadge status="neutral" className="w-fit">
            {CASE_STUDY.label}
          </StatusBadge>
          <p className="text-label uppercase text-ink-subtle">{CASE_STUDY.sector}</p>
          <h2 className="max-w-[26ch] text-h2">{CASE_STUDY.title}</h2>
          <p className="max-w-prose font-serif text-lead leading-[1.6] text-ink-muted">
            {CASE_STUDY.scenario}
          </p>
        </div>

        <div className="mt-12 grid gap-px bg-line lg:grid-cols-2">
          <Column
            heading="How it goes today"
            tone="bad"
            items={CASE_STUDY.without}
          />
          <Column heading="How it goes with CooL" tone="good" items={CASE_STUDY.with} />
        </div>

        <div className="mt-10 grid gap-px bg-line sm:grid-cols-3">
          {CASE_STUDY.figures.map((f) => (
            <div key={f.k} className="bg-canvas p-6">
              <p className="text-label uppercase text-ink-subtle">{f.k}</p>
              <p className="mt-2 font-editorial text-h2 leading-none text-ink">
                {f.v}
              </p>
              <p className="mt-3 text-xs text-ink-subtle">{f.basis}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 max-w-prose text-xs text-ink-subtle">
          Figures describe what the pipeline produces, not a measured customer
          result. You can reproduce each of them on this site: the{" "}
          <Link href="/#demo" className="text-ink underline underline-offset-4">
            live demo
          </Link>{" "}
          seals the record,{" "}
          <Link href="/verify" className="text-ink underline underline-offset-4">
            the verifier
          </Link>{" "}
          checks it offline, and{" "}
          <Link
            href="/security/readiness"
            className="text-ink underline underline-offset-4"
          >
            the readiness ladder
          </Link>{" "}
          states what is still simulated.
        </p>

        <Button asChild size="lg" className="mt-8">
          <Link href="/contact">
            Talk about your workflow
            <ArrowRight className="size-4" strokeWidth={2} />
          </Link>
        </Button>
      </Container>
    </section>
  );
}

function Column({
  heading,
  items,
  tone,
}: {
  heading: string;
  items: readonly string[];
  tone: "good" | "bad";
}) {
  const Icon = tone === "good" ? Check : Minus;
  return (
    <div className="bg-canvas p-7">
      <Eyebrow>{heading}</Eyebrow>
      <ul className="mt-5 flex flex-col gap-4">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <Icon
              className={`mt-1 size-4 shrink-0 ${
                tone === "good" ? "text-ok" : "text-ink-subtle"
              }`}
              strokeWidth={2.25}
              aria-hidden
            />
            <p className="text-sm text-ink-muted">{item}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
