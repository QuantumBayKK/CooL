import { Container, Eyebrow } from "@/components/ui/primitives";
import { REVIEWS } from "@/content/marketing";

/**
 * Customer reviews.
 *
 * Renders nothing until there are real ones. See the long note on `REVIEWS` in
 * `content/marketing.ts` for why the array is empty and why filling it with
 * invented quotes was not an option on this particular site.
 *
 * The component is complete and the data shape is settled, so shipping a real
 * quote is a content edit rather than a build: add entries to `REVIEWS` and
 * the section appears, laid out and styled, wherever it is mounted.
 *
 * `Review` structured data is deliberately NOT emitted even when quotes exist.
 * Google's review-snippet policy requires reviews to be collected from users
 * rather than authored by the site, and a self-published testimonial marked up
 * as an aggregate rating is exactly the pattern that earns a manual action.
 * Real quotes here are testimonials, presented as such.
 */
export function Reviews() {
  if (REVIEWS.length === 0) return null;

  return (
    <section id="reviews" className="section-y border-t border-line">
      <Container>
        <Eyebrow>What people who use it say</Eyebrow>
        <div className="mt-10 grid gap-px bg-line md:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r) => (
            <figure key={r.name} className="flex flex-col gap-5 bg-canvas p-7">
              <blockquote className="font-serif text-lead leading-[1.55] text-ink">
                “{r.quote}”
              </blockquote>
              <figcaption className="mt-auto">
                <p className="text-sm font-semibold text-ink">{r.name}</p>
                <p className="text-xs text-ink-subtle">{r.role}</p>
                <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-ink-subtle">
                  {r.source}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
