# CooL — Product Requirements Document (PRD)

### The CooL Website / Interactive Experience

| | |
|---|---|
| **Product** | CooL — *Cryptographic Observability and On-chain Ledger* |
| **Artifact** | Website & flagship interactive experience |
| **Doc type** | Product Requirements Document |
| **Version** | 1.0 |
| **Status** | Living document — tracks the build in this repo |
| **Last updated** | 2026-06-28 |
| **Owner** | Product / Creative & Experience Direction |
| **Related docs** | [STORY-BIBLE.md](creative/STORY-BIBLE.md) · [CREATIVE-DIRECTION-SYSTEM.md](creative/CREATIVE-DIRECTION-SYSTEM.md) · [TECHNICAL-ARCHITECTURE.md](creative/TECHNICAL-ARCHITECTURE.md) · [README.md](README.md) |

> **Document hierarchy.** The Story Bible and Creative Direction System are the creative source of truth; the Technical Architecture is the engineering source of truth. This PRD is the *product* source of truth — it states **what we are building, for whom, why, to what standard, and in what order.** Where this PRD and a creative/technical doc disagree on *intent*, the creative docs win; where they disagree on *scope/priority/sequencing*, this PRD wins.

---

## 1. Executive summary

CooL is infrastructure that makes AI decisions **cryptographically provable, operator-resistant, and impossible to secretly alter.** The website's job is **not** to explain cryptography. It is to make a high-value audience — investors, enterprise and technical leaders, regulators, and strategic partners — *emotionally understand why this technology must exist*, and only then reveal how it works.

The site is delivered as a **cinematic, scroll-driven interactive experience** ("a film that runs in a browser") structured as nine chapters that move the visitor from human stakes → a felt problem → relief → understanding → conviction. It is built as a production Next.js 15 / React 19 / TypeScript application with a modular engine architecture (Story, Scene, Animation, Audio, Asset).

**Primary outcome:** the right visitors leave thinking *"this is the inevitable trust layer for AI, built by a serious team,"* and take the next step appropriate to their role.

---

## 2. Problem & opportunity

### 2.1 Market problem (why CooL exists)
AI increasingly makes or shapes consequential human decisions — in healthcare, finance, education, law, employment, and public services. Yet the evidence behind those decisions is **fragile, opaque, and silently mutable**: records can be changed, lost, or reinterpreted with no trace, and decisions cannot be independently reproduced or verified. As accountability, audit, and regulatory pressure on AI rise, organizations need decisions that are **provable** and **operator-resistant** (changeable by no one, including the operator).

### 2.2 Website problem (why this site exists)
The audiences who matter (below) are sophisticated and skeptical. A conventional SaaS landing page that opens with cryptography jargon will not earn their trust or convey the category-defining ambition of the product. We need an experience that (a) creates emotional conviction before technical explanation, (b) signals serious engineering and taste, and (c) serves four distinct audiences in one coherent journey via **depth-on-demand**.

### 2.3 Opportunity
Be the definitive public artifact that frames "provable AI decisions" as an inevitable infrastructure category — and frames CooL as its leader.

---

## 3. Vision & positioning

- **Vision:** A world where every consequential AI decision can be proven — by anyone, changeable by no one.
- **Positioning line:** *The Trust Layer for Artificial Intelligence.*
- **Thesis (the soul of the brand):** **"Don't trust us — verify it yourself."**
- **Experience principle:** Atmosphere before information; show the wound before the cure; metaphor before mechanism; restraint as the luxury signal. (Full set: Story Bible §2 & §13.)

---

## 4. Goals & non-goals

### 4.1 Goals
- **G1 — Conviction:** Make visitors *feel* why provable AI decisions are necessary before any technical claim.
- **G2 — Credibility:** Signal serious, world-class engineering and taste (investor- and enterprise-grade).
- **G3 — One experience, four audiences:** Serve investors, technical/enterprise leaders, regulators, and partners via depth-on-demand without diluting any.
- **G4 — Action:** Convert conviction into the right next step per audience (read architecture / contact / partner).
- **G5 — Discoverability:** Be SEO-discoverable and shareable despite immersion (real DOM content, OG, structured data).
- **G6 — Quality bar:** Feel handcrafted — smooth, accessible, performant on the target device matrix.

### 4.2 Non-goals (for this product)
- **NG1:** Not a feature-by-feature SaaS marketing site or pricing-led funnel.
- **NG2:** Not the product app / dashboard / developer console (separate surface).
- **NG3:** Not exhaustive technical documentation (links out to docs; deep-dive lives past the film).
- **NG4:** Not a blog/CMS-driven content hub at launch.
- **NG5:** Does not perform real cryptographic verification of live customer data (the in-page "verify" is an honest, simplified demonstration).

---

## 5. Audiences & personas

| Persona | Who | What they must believe | How we earn it |
|---|---|---|---|
| **The Investor** | VCs, strategic capital | "Inevitable infrastructure; category leader will be huge; this team gets it deepest." | Vision, inevitability, taste, ambition |
| **The Operator** | Enterprise execs, CTOs, AI/ML & security leaders | "This is real engineering I could deploy; it solves my audit/liability/compliance exposure." | Precision, depth-on-demand, restraint, the live verify demo |
| **The Regulator** | Policy, compliance, public-sector | "This is what accountable AI looks like in practice." | Clarity, neutrality, seriousness, accessibility |
| **The Partner** | Ecosystem, integrators, co-builders | "We want to stand next to this." | Gravity, ambition, a clear partner path |

**Shared truth:** all four respond to the unmistakable signal of a serious team building something that must exist. Hype repels them; conviction attracts them.

---

## 6. Success metrics (KPIs)

Targets are recommended starting points; finalize against business goals (see Open Questions).

### 6.1 Engagement (the experience works)
- **M1 — Scroll depth:** ≥ 50% of sessions reach the Turn (Ch.3); ≥ 30% reach the Invitation (Ch.8).
- **M2 — Median session duration:** ≥ 90s (this is a film, not a bounce-and-skim page).
- **M3 — Interaction rate:** ≥ 25% of sessions trigger ≥ 1 interactive demo (tamper / try-to-change / verify).
- **M4 — Verify completion:** ≥ 15% of sessions complete the "Verify it yourself" sequence (Ch.6).

### 6.2 Conversion (action)
- **M5 — CTA click-through:** ≥ 8% of sessions click an Invitation path (architecture / contact / partners).
- **M6 — Qualified contact:** track inbound from "Talk to the team" / "Partners & investors".

### 6.3 Quality (the bar)
- **M7 — Performance:** Lighthouse Performance ≥ 90 where realistic for an animation-heavy experience; LCP < 2.5s, CLS < 0.1, INP good.
- **M8 — Smoothness:** sustained ~60fps for in-view motion on the mid-tier reference device.
- **M9 — Accessibility:** axe automated checks pass; full keyboard path; reduced-motion path; AA contrast.
- **M10 — Reach:** indexable; rich, correct social-share previews.

---

## 7. Experience overview

The experience is a single scroll timeline (one route) composed of nine chapters. Forward scroll = forward in time and understanding. Chapters transform into one another rather than cutting. Each chapter answers one question and plants the next. Emotional arc: **curiosity → uncertainty → concern → dread → relief → discovery → confidence → inspiration → conviction.**

Cross-cutting experience rules: no chrome during the Cold Open; recessive chrome (progress + sound toggle) afterward; sound off by default and opt-in; a dignified static path under reduced motion; depth-on-demand (metaphor for everyone, real technical terms for those who lean in).

---

## 8. Chapter map & per-chapter requirements

Each chapter is an isolated Scene module with a deterministic lifecycle (entry → idle → interaction → exit → cleanup). IDs map to `src/config/chapters.config.ts` and `src/features/chapter-*`.

| # | Chapter (id) | Question it answers | Beat | Key requirement | Status |
|---|---|---|---|---|---|
| 0 | **The Opening** (`opening`) | What is AI already deciding? | curiosity→uncertainty | Cold Open (3 lines, no chrome) → 5 documentary stories (4 clips each, crossfade, interstitials + closing question) → silence → Realization (point of light → trust network) → CooL identity reveal | **Built** |
| 1 | **The Question** (`the-question`) | How do we know the machine was right? | concern | Austere single-statement layout; warmth drains to cold | **Built** |
| 2 | **The Quiet Edit** (`the-quiet-edit`) | What happens to the evidence? | dread | Interactive record changes silently, hash unchanged ("no one would know"); **the deliberate low point** | **Built** |
| 3 | **The Turn** (`the-turn`) | Is there another way? | relief | Record is sealed (animated seal); accent born; thesis line; reframe trust | **Built** |
| 4 | **The Sealed Room** (`the-sealed-room`) | Where does a decision happen untampered? | discovery | 3D chamber (R3F) metaphor for TEE; depth-on-demand names the term | **Built** |
| 5 | **The Witnesses** (`the-witnesses`) | How can a record never be quietly changed? | confidence | Witness network + append-only + anchoring; **try-to-tamper → rejected** (villain's death) | **Built** |
| 6 | **Proof That Outlives Everything** (`proof-that-outlives`) | Will it hold; can anyone check it? | confidence | Post-quantum + offline; interactive **Verify it yourself** | **Built** |
| 7 | **The World, Rewritten** (`the-world-rewritten`) | What becomes possible? | inspiration | Opening's human scenes return, re-lit + proof mark | **Built** |
| 8 | **The Invitation** (`the-invitation`) | What do you do now? | conviction | Calm CTA, three audience paths, footer; the "document" begins | **Built (CTA targets are placeholders)** |

---

## 9. Functional requirements

Priority: **M** = Must, **S** = Should, **C** = Could, **W** = Won't (this release). Status: ✅ done · �ðŸŸ¡ partial · ⬜ not started.

### 9.1 Narrative engine & navigation
- **FR-1 (M, ✅)** Single-route scroll experience; chapters render in narrative order via a story stage.
- **FR-2 (M, ✅)** Story Engine: chapter metadata is data-driven (`chapters.config.ts`); adding a chapter = config entry + feature module.
- **FR-3 (M, ✅)** Scene Engine: each chapter pins and runs a scroll-scrubbed timeline inside an auto-cleaned context; deterministic across scroll direction; no leaks.
- **FR-4 (M, ✅)** Active-chapter tracking drives chrome and audio (both scroll directions).
- **FR-5 (S, ✅)** Recessive chrome (chapter progress + sound toggle) appears only after the Cold Open.
- **FR-6 (S, ⬜)** Click-to-jump chapter navigation from the progress indicator. *(Currently display-only.)*
- **FR-7 (C, ⬜)** "Skip the film / go to summary" affordance for return/low-patience visitors.

### 9.2 Motion & scroll
- **FR-8 (M, ✅)** Smooth scrolling (Lenis) wired to GSAP ScrollTrigger; consistent, responsive feel.
- **FR-9 (M, ✅)** Centralized, tunable pacing (`pacing.ts`) controlling per-chapter scroll length.
- **FR-10 (M, ✅)** Reusable motion presets from centralized tokens (no hand-rolled easings/durations).
- **FR-11 (M, ✅)** Reduced-motion path: static/cross-fade variant per chapter preserving meaning.

### 9.3 Media (video)
- **FR-12 (M, ✅)** Clip manifest maps logical ids → files + role; copy references ids, never paths.
- **FR-13 (M, ✅)** Lazy, controlled playback — only the visible clip in a crossfade decodes; next is warmed.
- **FR-14 (M, ✅)** Graceful placeholder when a clip file is absent (experience always runs).
- **FR-15 (S, ⬜)** Adaptive quality / `webm`/AV1 sources / poster frames / data-saver awareness.

### 9.4 Interactive demonstrations
- **FR-16 (M, ✅)** Ch.2 silent-tamper demo (scroll-driven + click), hash unchanged.
- **FR-17 (M, ✅)** Ch.5 tamper-rejection demo (attempt → rejected by witnesses).
- **FR-18 (M, ✅)** Ch.6 "Verify it yourself" stepped verification with success state.
- **FR-19 (M, ✅)** Reusable evidence-record, seal-mark, and trust-network visual primitives shared across chapters.
- **FR-20 (S, ⬜)** Deepen demos to be fully keyboard-operable and to expose real technical detail on demand in every chapter.

### 9.5 3D
- **FR-21 (M, ✅)** R3F sealed-room scene, dynamically imported (SSR off), with a static fallback under reduced motion.
- **FR-22 (S, ⬜)** Bloom/post-processing for premium glow; per-device quality scaling (DPR/LOD/disable on low-power/mobile).
- **FR-23 (C, ⬜)** Additional bespoke 3D for the Turn / Witnesses / Proof chapters.

### 9.6 Audio
- **FR-24 (M, ✅)** Audio Engine: per-chapter ambient crossfade; muted by default; opt-in toggle; graceful when files absent.
- **FR-25 (M, ✅)** One-shot cue system bound to meaningful moments (tamper/seal/reject/verified).
- **FR-26 (M, ⬜)** Actual audio assets (9 ambient loops + cues). *(Engine ready; files pending.)*
- **FR-27 (C, ⬜)** Spatial/positional audio (e.g., witness nodes).

### 9.7 Conversion & "real website"
- **FR-28 (M, 🟡)** Invitation chapter with three differentiated audience CTAs + footer. *(Targets are `#` placeholders.)*
- **FR-29 (M, ⬜)** Reference pages the CTAs point to: technical architecture/security overview, team/about, contact, partners/investors, legal.
- **FR-30 (S, ⬜)** Working contact capture (form or routed mail) with spam protection.

### 9.8 Entry & loading
- **FR-31 (S, ⬜)** Tasteful preloader gating on critical assets (fonts + first clips) with a single first-gesture that also unlocks audio.

---

## 10. Non-functional requirements

- **NFR-1 — Performance (M):** Lighthouse ≥ 90 where realistic; LCP < 2.5s, CLS < 0.1, good INP. Aggressive code-splitting; 3D/Three loaded only on demand (currently split into its own chunk; initial First Load ≈ 198 kB).
- **NFR-2 — Smoothness (M):** ~60fps in-view motion on the reference device; compositor-friendly properties; no jank (smoothness is a release gate).
- **NFR-3 — Accessibility (M):** semantic landmarks, logical headings, keyboard operability for all interactions, visible focus, ARIA where needed, AA contrast, `prefers-reduced-motion` honored, complete non-interactive reading path, skip link.
- **NFR-4 — Responsive (M):** designed (not scaled) layouts for cinematic-desktop / laptop / tablet / mobile; 3D simplifies on small/low-power devices; **no chapter dropped**.
- **NFR-5 — SEO (M):** server-rendered real DOM copy, semantic metadata, OG/Twitter cards, structured data, canonical, sitemap, robots.
- **NFR-6 — Browser support (M):** latest Chromium, Safari, Firefox (desktop + mobile); graceful degradation otherwise.
- **NFR-7 — Privacy & security (M):** privacy-respecting analytics; no unnecessary PII; standard web security headers; respect Do-Not-Track / data-saver where feasible.
- **NFR-8 — Maintainability (M):** strict TypeScript, single-responsibility modules, isolated engines, data-driven config, no duplicated motion logic.
- **NFR-9 — Observability (S):** runtime error monitoring + core analytics events for the KPIs in §6.
- **NFR-10 — Testing (S):** unit (utils/store/engine), component (media fallback, chapter lifecycle), a11y automation, perf regression watch.

---

## 11. Content & asset requirements

- **CR-1 — Footage (M, provided):** 5 stories × 4 roles (establishing/human/ai/emotion) under `public/clips/<category>/clip1–4.mp4`. *(Delivered.)* Encoding/optimization pending (FR-15).
- **CR-2 — Audio (M, pending):** 9 ambient loops + 5 cues per [public/audio/README](public/audio/README.md).
- **CR-3 — Copy (M, 🟡):** Narrative copy is implemented per the Opening spec and Story Bible; final editorial polish + the reference-page copy pending.
- **CR-4 — Fonts (M, ✅):** Fraunces (display), Inter (body), JetBrains Mono (technical) via `next/font`.
- **CR-5 — Brand assets (S, ⬜):** logo lockup/favicon/OG share image; (the wordmark currently renders as type).
- **CR-6 — Transition clips (C, ⬜):** optional abstract transitions (`transition-01..10.mp4`) — manifest supports them; not required.

---

## 12. Technical architecture (summary)

Full detail: [TECHNICAL-ARCHITECTURE.md](creative/TECHNICAL-ARCHITECTURE.md).

- **Stack:** Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · GSAP + ScrollTrigger · Lenis · Zustand · Three.js / React Three Fiber / Drei (on-demand) · Framer Motion (UI micro).
- **Systems, not pages:** Story / Scene / Animation / Audio engines + Asset manager, each isolated with clear interfaces.
- **State:** one lightweight global store (scroll progress, active chapter, audio, reduced-motion, asset readiness); everything else local.
- **Structure:** feature-based folders, centralized config (tokens/pacing/manifests), explicit naming (no `misc`/`helpers`).

---

## 13. Analytics & measurement plan

- **AN-1 (S, ⬜):** Instrument events for KPIs: chapter_view (per chapter), interaction_triggered (demo id), verify_completed, cta_click (path), sound_enabled, reduced_motion.
- **AN-2 (S, ⬜):** Funnel: Opening → Turn → Verify → Invitation → CTA.
- **AN-3 (S, ⬜):** Privacy-first tool; no cross-site tracking; respect DNT.

---

## 14. Scope

### 14.1 In scope (current release)
The nine-chapter cinematic experience; engine architecture; interactive demos; chrome; reduced-motion path; SEO metadata; the integrated footage; the audio engine (assets pending).

### 14.2 Out of scope (this release → future)
Reference/marketing sub-pages (FR-29), working contact capture (FR-30), audio assets (FR-26), entry preloader (FR-31), chapter jump-nav (FR-6), analytics instrumentation (AN-*), automated test suite (NFR-10), CMS/blog, the product app itself.

---

## 15. Release plan / milestones

- **M0 — Creative & architecture foundation (✅ done):** Story Bible, Creative Direction System, Technical Architecture.
- **M1 — Vertical slice (✅ done):** Project scaffold + Opening Sequence working end-to-end with real footage.
- **M2 — Full film (✅ done):** All nine chapters, audio engine, chrome.
- **M3 — Polish pass 1 (✅ done):** Pacing/scroll, clip-transition fixes, typography/color, sound cues, improved 3D, film grain.
- **M4 — Tuning & assets (next):** Live visual tuning pass (timings/positions/3D framing) + audio assets + video optimization + entry preloader.
- **M5 — Conversion surfaces:** Reference pages, working CTAs/contact, OG/favicon/brand assets.
- **M6 — Hardening & launch:** Mobile/responsive pass, accessibility audit, analytics + error monitoring, tests, performance pass, cross-browser QA, CI/CD + deploy.

---

## 16. Current status snapshot (as of this version)

- ✅ Builds clean (typecheck + lint), runs; all nine chapters render with server-side copy; footage serves; fonts wired; 3D scene loads on demand.
- 🟡 Audio engine present but silent (no asset files); Invitation CTAs are placeholders; copy is implemented but not final-edited.
- ⬜ Reference pages, analytics, tests, entry preloader, mobile/perf/a11y hardening, deployment pipeline.
- ⚠️ **Known caveat:** all animation timings, element positions, and 3D framing were authored without a live visual review — a tuning pass (M4) is required before launch.

---

## 17. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **R1** Animation-heavy site underperforms on low-end/mobile | Bounce, poor perception | Per-device 3D scaling, reduced-motion path, code-splitting, perf budget gate (NFR-1/2/4) |
| **R2** "Cinematic" hurts SEO/discoverability | Lost reach | Real server-rendered DOM copy + metadata/OG/structured data (NFR-5) |
| **R3** Audio autoplay blocked / annoying | Broken or off-putting audio | Off by default; first-gesture unlock; cues no-op when muted (FR-24/31) |
| **R4** Tone misread (fear-mongering vs. hope) | Wrong emotional residue | End on optimism/inevitability; protect the dip→rise arc (Story Bible) |
| **R5** Over-claiming technical guarantees in copy | Credibility/legal exposure | Honest "simplified demonstration" framing; legal review of claims |
| **R6** Long film loses impatient/return visitors | Drop-off | Tightened pacing (done); add skip/summary + jump-nav (FR-6/7) |
| **R7** Scope creep into product app / docs hub | Delay | Hard scope boundaries (§4.2, §14) |

---

## 18. Open questions / decisions needed

- **Q1** Launch date / hard deadline?
- **Q2** Real CTA destinations: where do "Architecture", "Contact", "Partners & investors" point (existing docs, calendar, form, email)? Confirm the contact address.
- **Q3** KPI targets — confirm or adjust §6 against business goals.
- **Q4** Analytics tool of choice (privacy-first) and consent requirements per region.
- **Q5** Audio: source/commission vs. generate? Desired mood references.
- **Q6** Brand assets: is there a logomark/wordmark, or is the type-set wordmark final?
- **Q7** Legal review needed for technical claims (TEE/PQC/operator-resistant) before launch?
- **Q8** Hosting/deploy target and environments (staging/prod).

---

## 19. Dependencies

- Final footage encoding/optimization (CR-1/FR-15).
- Audio assets (CR-2/FR-26).
- Reference-page content + contact routing (FR-29/30).
- Brand assets (CR-5).
- Hosting/CI decision (Q8).

---

## 20. Definition of done (release acceptance)

A release is shippable when:
- All **Must** functional requirements are ✅ and all **Must** NFRs pass their gates (perf, a11y, responsive, SEO, browser matrix).
- The experience runs smoothly across the device matrix with no jank on the reference device; reduced-motion and keyboard paths are complete.
- Real CTAs resolve; contact capture works; analytics + error monitoring live.
- Audio assets present (or audio explicitly descoped for the release).
- A live tuning pass has been completed and signed off (M4).
- Build is green (typecheck + lint + tests) and deploys via the pipeline.

---

## 21. Glossary

- **TEE (Trusted Execution Environment):** a sealed compute chamber whose integrity can be attested from outside ("the sealed room").
- **Transparency log / append-only ledger:** a record you can add to but never rewrite or delete from ("the ledger that only grows").
- **Witness network:** independent parties that attest to records, so they can't all be silenced ("the witnesses").
- **Blockchain anchoring:** committing a record's fingerprint to a public, immutable foundation ("carving it in bedrock").
- **Post-quantum cryptography:** signatures designed to resist future quantum computers ("future-proof locks").
- **Offline / independent verification:** checking proof yourself without trusting CooL's servers ("proof you can carry away").
- **Operator-resistant:** even the people running the system cannot secretly alter the record.
- **Depth-on-demand:** metaphor for the casual viewer; real technical detail revealed for those who lean in.

---

*End of PRD v1.0. This document is maintained alongside the build; update status fields and the milestone tracker as work lands.*
