import { Eyebrow, StatusBadge } from "@/components/ui/primitives";
import { DECK, DECK_META, type DeckSlide } from "@/content/deck";

/**
 * The pre-seed deck, rendered in the site's own typography.
 *
 * ── why not embed the PDF ──
 *
 * The room previously said the deck was distributed as a file, so that a copy
 * sent to one investor could not silently differ from the one in the room.
 * That reasoning was sound about *versioning* and wrong about *reading*: a
 * 12-slide PDF in an iframe is unreadable on a phone, invisible to the room's
 * search, impossible to link into at a specific claim, and inaccessible to a
 * screen reader unless the deck was tagged — which decks never are.
 *
 * Rendering from `content/deck.ts` keeps the version guarantee (one source,
 * transcribed verbatim, in git with a diff on every change) and drops the
 * costs. The downloadable file stays available from the data room for anyone
 * who wants the artefact itself.
 *
 * ── the transcription rule ──
 *
 * Figures, the ask, the cap and the team claims are verbatim. See the header
 * of `content/deck.ts`: an investor holding the PDF and this page must be
 * holding one document, not two. Slides the deck marks as forward-looking
 * carry a "planned" badge here, because that labelling is content — it is the
 * difference between a pipeline and booked traction, and dropping it in the
 * port would be the single most damaging edit this file could make.
 */
export function Deck() {
  return (
    <div className="flex flex-col">
      <header className="border-b border-line pb-8">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-subtle">
          {DECK_META.stamp}
        </p>
        <h2 className="mt-4 font-editorial text-display leading-[1.05]">
          The black box for AI.
        </h2>
        <p className="mt-5 max-w-prose font-serif text-lead leading-[1.6] text-ink-muted">
          {DECK_META.company} — {DECK_META.founders.map((f) => `${f.name} (${f.role})`).join(" · ")}
        </p>
        <dl className="mt-7 grid gap-px border border-line bg-line sm:grid-cols-2">
          {[
            ["Ask", DECK_META.ask],
            ["Terms", DECK_META.terms],
          ].map(([k, v]) => (
            <div key={k} className="bg-canvas p-4">
              <dt className="text-label uppercase text-ink-subtle">{k}</dt>
              <dd className="mt-1.5 text-h4 text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </header>

      {DECK.map((slide) => (
        <Slide key={slide.id} slide={slide} />
      ))}

      <footer className="border-t border-line py-8">
        <p className="text-sm text-ink-muted">
          Questions on any figure here go straight to the founders —{" "}
          <a
            href={`mailto:${DECK_META.contact}`}
            className="text-accent underline underline-offset-4"
          >
            {DECK_META.contact}
          </a>
          . The original file is in the data room if you want the artefact
          rather than the text.
        </p>
      </footer>
    </div>
  );
}

function Slide({ slide }: { slide: DeckSlide }) {
  return (
    <section
      id={slide.id}
      className="scroll-mt-24 border-b border-line py-12 last:border-b-0"
    >
      <Eyebrow>{slide.eyebrow}</Eyebrow>

      {slide.planned && (
        <StatusBadge status="warn" className="mt-3">
          Planned · not booked traction
        </StatusBadge>
      )}

      <h3 className="mt-4 max-w-[28ch] text-h2">{slide.title}</h3>

      {slide.lead && (
        <p className="mt-5 max-w-prose font-serif text-lead leading-[1.6] text-ink-muted">
          {slide.lead}
        </p>
      )}

      {slide.figures && (
        <div className="mt-8 grid gap-px bg-line sm:grid-cols-3">
          {slide.figures.map((f) => (
            <div key={f.k} className="bg-canvas p-5">
              <p className="text-label uppercase text-ink-subtle">{f.k}</p>
              <p className="mt-2 font-editorial text-h1 leading-none text-ink">
                {f.v}
              </p>
              <p className="mt-2.5 text-xs text-ink-subtle">{f.note}</p>
            </div>
          ))}
        </div>
      )}

      {slide.points && (
        <ol className="mt-8 grid gap-px bg-line sm:grid-cols-2">
          {slide.points.map((p) => (
            <li key={p.title} className="bg-canvas p-5">
              {p.n && (
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-accent">
                  {p.n}
                </p>
              )}
              <p className="mt-1.5 text-h4 text-ink">{p.title}</p>
              <p className="mt-2 text-sm text-ink-muted">{p.body}</p>
            </li>
          ))}
        </ol>
      )}

      {slide.split && (
        <div className="mt-8 grid gap-px bg-line lg:grid-cols-2">
          {[
            { title: slide.split.leftTitle, items: slide.split.left, real: true },
            { title: slide.split.rightTitle, items: slide.split.right, real: false },
          ].map((col) => (
            <div key={col.title} className="bg-canvas p-6">
              <Eyebrow>{col.title}</Eyebrow>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-ink-muted">
                    <span
                      aria-hidden
                      className={col.real ? "text-ok" : "text-ink-subtle"}
                    >
                      {col.real ? "✓" : "·"}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {slide.rows && (
        <dl className="mt-8 border-t border-line">
          {slide.rows.map(([k, v]) => (
            <div
              key={k}
              className="grid gap-1 border-b border-line py-3.5 sm:grid-cols-[minmax(0,20rem)_1fr] sm:gap-8"
            >
              <dt className="text-sm text-ink">{k}</dt>
              <dd className="text-sm text-ink-muted">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {slide.footnote && (
        <p className="mt-7 border-l-2 border-accent pl-4 text-sm leading-relaxed text-ink-muted">
          {slide.footnote}
        </p>
      )}
    </section>
  );
}
