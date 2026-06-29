# CooL — TECHNICAL ARCHITECTURE

### Engineering Architecture & Implementation Specification

> Translates [STORY-BIBLE.md](./STORY-BIBLE.md) and [CREATIVE-DIRECTION-SYSTEM.md](./CREATIVE-DIRECTION-SYSTEM.md) into systems. **Engineering exists to enable storytelling, not compete with it.**
>
> **Status:** v1.0 · **Authority:** Subordinate to the two creative documents.

---

## 1. PRINCIPLES

- **Systems, not pages.** The app is one narrative engine that mounts independent chapter modules. There is effectively one route; "pages" are chapters on a scroll timeline.
- **Production quality, no shortcuts.** Strict TypeScript, single-responsibility modules, reusable systems, deterministic scene lifecycles, no memory leaks.
- **Data-driven everything.** Timing, easing, durations, breakpoints, motion presets, chapter metadata, and the asset manifest live in centralized config — never duplicated in components.
- **Presentation ≠ logic.** Scene orchestration lives in engines/hooks; components render. Complex timelines live in controllers/hooks, not JSX.
- **Performance is a feature.** 60fps in-view motion target, aggressive code-splitting, lazy 3D, adaptive DPR, graceful degradation, reduced-motion as a first-class path.
- **Accessible by construction.** Semantic HTML, keyboard paths, ARIA, focus management, contrast, and a complete non-interactive reading path from day one.

---

## 2. STACK

| Concern | Choice | Notes |
|--------|--------|-------|
| Framework | **Next.js 15 (App Router)** + **React 19** | Server components where possible; client islands for motion/3D. |
| Language | **TypeScript (strict)** | `strict`, `noUncheckedIndexedAccess`, no implicit any. |
| Styling | **Tailwind CSS v4** | CSS-first `@theme`; design tokens as CSS variables. |
| Cinematic animation | **GSAP + ScrollTrigger** | The primary timeline & scroll-orchestration engine. |
| UI micro-interactions | **Framer Motion** | Only where GSAP would be overkill (hover, mount/unmount of UI). |
| 3D | **Three.js + React Three Fiber + Drei** | Immersive chapters (Sealed Room, Witnesses). Dynamically imported. |
| Smooth scroll | **Lenis** | Drives GSAP ScrollTrigger via its RAF. |
| State | **Zustand** | One lightweight store for truly global state only. |
| Advanced sequencing | **Theatre.js** | *Optional*, only if a set-piece needs it. Not a default dependency. |

**Dependency discipline:** Heavy lib(three/r3f/drei) are dynamically imported and only loaded for chapters that need them. The Opening uses a performant 2D canvas for its network reveal (the right tool for a flat reveal); R3F is reserved for genuinely volumetric chapters.

---

## 3. FOLDER STRUCTURE

```
website/
├─ creative/                         # Source-of-truth docs (this folder)
├─ public/
│  ├─ clips/                         # Cinematic footage (see §7 naming convention)
│  ├─ audio/                         # Ambient loops & cues
│  └─ og/                            # Social/OG assets
├─ src/
│  ├─ app/                           # Next App Router
│  │  ├─ layout.tsx                  # Root layout, metadata, providers
│  │  ├─ page.tsx                    # The experience (mounts the Story Engine)
│  │  └─ globals.css                 # Tailwind v4 @theme + design tokens
│  ├─ config/                        # DATA — single source of truth for values
│  │  ├─ motion.tokens.ts            # durations, easings, stagger
│  │  ├─ breakpoints.ts              # responsive breakpoints
│  │  ├─ chapters.config.ts          # chapter metadata (Story Engine data)
│  │  └─ clips.manifest.ts           # clip ids → filenames + roles
│  ├─ engines/                       # Isolated systems with clear interfaces
│  │  ├─ story/                      # chapter sequencing, progression, metadata
│  │  ├─ scene/                      # scene lifecycle (entry/idle/interact/exit/cleanup)
│  │  ├─ animation/                  # GSAP registration + reusable presets
│  │  ├─ assets/                     # asset manager (preload, readiness)  [scaffold]
│  │  └─ audio/                      # audio engine (ambient, cues, crossfade) [scaffold]
│  ├─ providers/                     # React context providers
│  │  ├─ SmoothScrollProvider.tsx    # Lenis ↔ GSAP wiring
│  │  └─ ExperienceProvider.tsx      # boots stores + global lifecycle
│  ├─ stores/
│  │  └─ experience.store.ts         # Zustand: scroll, chapter, audio, a11y, assets
│  ├─ hooks/                         # reusable behavior
│  │  ├─ useIsomorphicLayoutEffect.ts
│  │  ├─ usePrefersReducedMotion.ts
│  │  └─ useChapterScroll.ts         # scroll-progress for a pinned chapter
│  ├─ components/                    # cohesive component library
│  │  ├─ typography/                 # CinematicLine, etc. (Narrator/Witness voices)
│  │  ├─ media/                      # VideoClip (lazy, intersection-driven)
│  │  ├─ visual/                     # TrustNetwork (canvas), particles, indicators
│  │  └─ chrome/                     # recessive UI (progress, sound toggle) [scaffold]
│  ├─ features/                      # chapter modules (one folder per chapter)
│  │  └─ chapter-00-opening/
│  │     ├─ OpeningSequence.tsx      # chapter orchestrator
│  │     ├─ ColdOpen.tsx             # black → first lines
│  │     ├─ DocumentaryStory.tsx     # reusable 4-clip story scene
│  │     ├─ Realization.tsx          # "we trusted AI…" → light
│  │     ├─ LogoReveal.tsx           # CooL identity birth
│  │     └─ opening.data.ts          # the 5 stories + copy (data-driven)
│  ├─ three/                         # R3F scenes (reserved for immersive chapters)
│  ├─ lib/                           # pure utilities (explicitly named, no "helpers")
│  └─ types/                         # shared types
├─ package.json, tsconfig.json, next.config.ts, postcss.config.mjs, eslint.config.mjs
```

**Naming:** every file name states its responsibility. No `misc`, no `helpers`, no `utils.ts` grab-bags — `lib/` holds explicitly named pure functions only.

---

## 4. THE ENGINES

Each engine is isolated with a clear public interface; chapters depend on interfaces, never internals.

### 4.1 Story Engine (`engines/story`)
Owns chapter sequencing and narrative metadata (`config/chapters.config.ts`): order, ids, emotional beat, theme temperature, whether it needs 3D, preload hints. Exposes the ordered chapter list and the active-chapter derivation from global scroll progress. The page maps over this list; adding a chapter = adding a config entry + a feature module.

### 4.2 Scene Engine (`engines/scene`)
Standardizes the chapter lifecycle so all chapters behave identically: **entry → idle → interaction → exit → cleanup.** Provides the chapter shell (pinning, scroll-progress wiring, mount/unmount, GSAP context cleanup) so individual scenes are deterministic regardless of scroll direction and leak nothing. Scenes register their timelines in a GSAP `context` that is reverted on unmount.

### 4.3 Animation Engine (`engines/animation`)
Single place that registers GSAP plugins (ScrollTrigger) and exposes the **motion presets** from the Creative Direction System (`seal`, `witness`, `anchor`, `verifyPulse`, `assemble`, `mutate`, `reveal`, `recede`) as reusable factories reading from `config/motion.tokens.ts`. No component hand-rolls easings or durations.

### 4.4 Asset Manager (`engines/assets`) — scaffolded
Centralizes preload strategy and readiness state (videos, audio, textures, HDRIs, fonts, models). Reports readiness to the store so the experience can gate the opening behind a tasteful loader. Intersection-based: only active/imminent chapters load heavy media.

### 4.5 Audio Engine (`engines/audio`) — scaffolded
Per the Creative Direction System §5: ambient loops with crossfade on chapter change, sparse one-shot cues bound to motion presets, master-muted by default with opt-in, reduced-sound aware, built to extend to spatial audio. Implemented behind an interface now; wired chapter-by-chapter.

---

## 5. STATE (Zustand — `stores/experience.store.ts`)

Global state is *only* what is truly cross-cutting:
- `scrollProgress` (0–1 over the whole experience) and `activeChapterId`
- `assetsReady` / loader state
- `audioEnabled`, `audioReady`
- `reducedMotion` (synced from OS + user toggle)
- `hasEntered` (the user has started the film)

Everything else is local React state. No prop-drilling of scroll; components subscribe to slices.

---

## 6. SCROLL & MOTION ORCHESTRATION

- **Lenis** owns the scroll surface; its RAF drives **GSAP ScrollTrigger** (`ScrollTrigger.update` on Lenis scroll; `gsap.ticker` lagSmoothing off). This is wired once in `SmoothScrollProvider`.
- Chapters use **pinned, scroll-progress-driven** timelines: each chapter pins for a tall scroll distance; clips crossfade and typography appears at progress thresholds — Apple/Netflix-style. Fully **reversible**; scrubbing back renders correctly.
- All chapter timelines live inside a **`gsap.context`** scoped to the chapter root and **reverted on unmount** → no leaks, no cross-chapter timeline conflicts.
- **Reduced motion:** the provider detects it and chapters render a dignified still/cross-fade variant (no pinning, no scrub) carrying the same meaning.

---

## 7. THE VIDEO / CLIP SYSTEM

**Clip manifest** (`config/clips.manifest.ts`) is the single source of truth mapping logical clip ids → filenames + role. The Opening's `opening.data.ts` references clip ids, never raw paths.

**Naming convention (drop files into `public/clips/`):**

```
<story>-<NN>-<role>.mp4

story : healthcare | finance | education | law | employment
NN    : 01 | 02 | 03 | 04
role  : establishing | human | ai | emotion

examples:
  healthcare-01-establishing.mp4
  healthcare-02-human.mp4
  healthcare-03-ai.mp4
  healthcare-04-emotion.mp4
  finance-01-establishing.mp4   ... etc for finance, education, law, employment
transitions:
  transition-01.mp4 ... transition-10.mp4
```

**`VideoClip` component requirements:**
- Lazy-loaded; `preload="none"` until imminent; **intersection-driven play/pause** (never plays off active scene).
- Muted, `playsInline`, smooth loop; programmatic crossfade between clips.
- **Graceful fallback:** if a file is absent (clips not downloaded yet), renders a tasteful lit-gradient placeholder with the role label — the experience still runs end-to-end before assets land.
- Efficient memory cleanup on unmount (detach src, pause).
- Adaptive quality hooks (data-saver / connection-aware) reserved.

---

## 8. RESPONSIVE & ACCESSIBILITY

- **Designed breakpoints**, not scaling: cinematic-desktop / laptop / tablet / mobile. 3D simplifies on mobile; **no chapter is dropped** — narrative continuity is preserved everywhere.
- Fluid type via `clamp()`; per-breakpoint spacing & motion timing.
- Semantic landmarks, logical heading order, keyboard operability for every interactive demo, visible focus, ARIA for custom controls, `prefers-reduced-motion` honored, AA contrast. A complete linear reading path exists without JS-driven motion.

---

## 9. PERFORMANCE

- Server components for static shell; client islands for motion/3D. Aggressive dynamic imports; three/r3f only on demand.
- Animate compositor properties (transform/opacity); avoid layout thrash; will-change used surgically.
- Adaptive DPR, instancing, material reuse, frustum culling, LOD for 3D chapters; no gratuitous post-processing.
- Preload only critical assets; lazy-load the rest; continuous bundle-size watch. Lighthouse > 90 where realistic for an animation-heavy experience; Core Web Vitals optimized (LCP via fast first paint of the Cold Open, CLS ~0 via reserved layout).

---

## 10. SEO

Semantic metadata, Open Graph/Twitter cards, structured data, canonical URLs, sitemap + robots, server-rendered meaningful content (the narrative copy is real DOM text, not baked into canvas), descriptive titles. Discoverable despite immersion.

---

## 11. TESTING & DELIVERY

- **Unit:** lib utilities, store logic, engine derivations.
- **Component:** typography, VideoClip fallback, chapter shell lifecycle.
- **Lifecycle:** scenes mount/unmount without leaks; deterministic across scroll direction.
- **A11y:** automated axe checks + keyboard/reduced-motion manual gates.
- **Perf:** bundle-size budget and frame-time spot checks; regression watch.
- **CI/CD:** typecheck + lint + build gate; staging/production envs; fingerprinted assets; media compression in the asset pipeline; runtime error + privacy-respecting analytics, thoughtfully integrated.

---

## 12. THE GOVERNING QUESTION (FOR EVERY PR)

> Does this technical decision serve the creative vision? Never sacrifice maintainability for visual novelty, nor emotional impact for engineering convenience. The app should feel **handcrafted, not assembled.**

---

*End of Technical Architecture v1.0.*
