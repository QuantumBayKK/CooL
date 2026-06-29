# CooL — The Trust Layer for Artificial Intelligence

A cinematic interactive experience about the future of trust in AI. Not a landing
page — a film that runs in a browser, where scrolling is the edit, typography is the
narrator, and motion is the argument.

## Source of truth

Read these first — every design and engineering decision traces back to them:

1. [`PRD.md`](PRD.md) — product requirements: what we're building, for whom, why, scope, requirements, status, roadmap.
2. [`creative/STORY-BIBLE.md`](creative/STORY-BIBLE.md) — narrative, chapters, emotional arc, the creative constitution.
3. [`creative/CREATIVE-DIRECTION-SYSTEM.md`](creative/CREATIVE-DIRECTION-SYSTEM.md) — art direction, design tokens, motion/sound/component grammar.
4. [`creative/TECHNICAL-ARCHITECTURE.md`](creative/TECHNICAL-ARCHITECTURE.md) — stack, engines, folder structure, performance/a11y/SEO.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
GSAP + ScrollTrigger · Lenis · Zustand · (Three.js / R3F / Drei reserved for the
immersive chapters).

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck  # strict tsc
npm run lint
```

## Status

**All nine chapters are implemented** — the complete narrative arc from human stakes
to conviction:

0. **The Opening** — Cold Open → 5 documentary stories → silence → the Realization (point of light → trust network) → CooL identity born.
1. **The Question** — austerity; one unavoidable question.
2. **The Quiet Edit** — the dread low-point; an interactive record changes silently, no trace left.
3. **The Turn** — the record is sealed; the accent is born; *"Don't trust us. Verify it yourself."*
4. **The Sealed Room** — TEE as a real R3F chamber (dynamically imported), depth-on-demand naming.
5. **The Witnesses** — witness network + append-only + anchoring; try to tamper → rejected.
6. **Proof That Outlives Everything** — post-quantum + an interactive *Verify it yourself* widget.
7. **The World, Rewritten** — the opening's human scenes return, re-lit and provable.
8. **The Invitation** — calm CTA; the film ends, the document begins.

Chapters mount in order via [`src/features/StoryStage.tsx`](src/features/StoryStage.tsx).
Each is an isolated Scene-Engine module (entry → idle → interaction → exit → cleanup).
Recessive chrome (progress + sound toggle) appears after the Cold Open. The Audio
Engine crossfades per-chapter ambience once you add files under `public/audio/`
(see [`src/config/audio.manifest.ts`](src/config/audio.manifest.ts)) — it no-ops
gracefully until then. Reduced-motion renders a dignified static path throughout.

## Footage

Clips live under [`public/clips/<category>/clip1–4.mp4`](public/clips) (categories:
`hospital`, `fintech`, `education`, `law`, `employment`). The logical
story/role → file mapping is in
[`src/config/clips.manifest.ts`](src/config/clips.manifest.ts). Missing files degrade
to tasteful lit placeholders, so the experience always runs.
