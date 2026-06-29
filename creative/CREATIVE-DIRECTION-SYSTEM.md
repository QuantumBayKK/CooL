# CooL — CREATIVE DIRECTION SYSTEM

### Art Direction, Design System Foundations, Motion, Sound & Component Grammar

> Companion to [STORY-BIBLE.md](./STORY-BIBLE.md). The Story Bible defines **what we say and why**. This document defines **how it looks, moves, sounds, and feels** — the executable craft layer that designers and engineers build from.
>
> **Status:** Master creative direction — v1.0 · **Authority:** Subordinate only to the Story Bible. Where this document specifies a value (a color, a duration, a curve), that value is the default until consciously amended.

---

## 0. THE ONE-LINE BRIEF

> *A cinematic documentary about the future of trust, rendered in a browser — where scrolling is the edit, typography is the narrator, motion is the argument, and the interface all but disappears.*

If a reviewer ever asks "what are we making?", that sentence is the answer. Not a website. A film with a pulse you can touch.

---

## 1. THE FOUR GOVERNING QUESTIONS (THE FILTER)

Every asset, component, animation, and line of copy must pass through this filter before it ships. Pin it above every desk and every PR.

1. **Does this strengthen the story?**
2. **Does this improve understanding?**
3. **Does this increase trust?**
4. **Does this make the experience feel more premium and emotionally resonant?**

If the answer to all four is not a confident yes, **remove it or redesign it.** When two solutions communicate the same idea, the simpler one wins — always.

---

## 2. ART DIRECTION

### 2.1 The aesthetic thesis

**Timeless, not trendy. Institutional, not startup. Cinematic, not decorative.** We are art-directing the visual identity of foundational infrastructure — the kind of thing that, in ten years, looks like it was inevitable. The benchmark is not "best AI startup site of the year." It is "the visual language a serious civilization would choose for its accountability layer."

### 2.2 Sources of inspiration (and what we take from each)

- **Architecture** — monumental scale, load-bearing structure, the honesty of materials, light as a building element.
- **Industrial & product design** — precision, restraint, the beauty of function, perfect tolerances.
- **Aerospace engineering** — seriousness, reliability, instruments that must not lie.
- **Scientific visualization** — clarity under complexity, data rendered as truth, not decoration.
- **Premium editorial design** — typographic confidence, generous margins, pacing across a spread.
- **Modern museums** — curation, negative space, one object lit in the dark, wall-text discipline.
- **Luxury technology** — tactile craft, the feel of something engineered by people who cared about the parts you never see.

### 2.3 The forbidden list (anti-patterns)

These read as *cheap* or *dated* and are banned outright:

- Neon "cyberpunk" glows, Matrix rain, hex-dump backgrounds, hooded-hacker imagery.
- Generic blockchain clichés: floating glowing cubes labeled "BLOCK," gold coins, chain-link icons, isometric crypto cities.
- Stock "AI" tropes: glowing blue brains, humanoid robots, binary tunnels, circuit-board faces.
- Gradient-soup hero sections, glassmorphism for its own sake, drop-shadow excess, emoji in UI.
- Stocky corporate "diverse team pointing at a screen" photography.
- Motion that bounces, springs playfully, or wobbles. We have *mass*, not *bounce*.

### 2.4 Visual grammar (one consistent language for all illustration, diagrams, 3D, and UI)

Everything visual shares this grammar so the whole experience reads as one world:

- **Clean geometry** with intentional imperfection (subtle grain, soft falloff) so it never feels sterile-digital.
- **Layered transparency & depth** — real z-depth, parallax, atmospheric haze; never flat stickers.
- **Soft, single-source lighting** — every scene is *lit*; deep blacks, controlled highlights, volumetric falloff.
- **Restrained gradients** — used for depth and light, never as decoration. No rainbow ramps.
- **Subtle particle systems** — dust, signal, witnesses; always meaningful (atmosphere or data), never confetti.
- **Procedural motion** — organic, weighted, continuous; nothing on a mechanical loop that the eye can catch repeating.
- **Precision as the through-line** — every edge, every alignment, every pixel reads as deliberate. Clutter is the enemy of trust.

---

## 3. DESIGN SYSTEM FOUNDATIONS

These are the canonical design tokens. They are duplicated as code in the build (`/src/config/tokens` and the Tailwind `@theme`); this section is their human-readable source of truth. **Final hex/values are tuned in implementation against real assets — the relationships and intent here are binding; the exact numbers are starting points.**

### 3.1 Color — the chromatic timeline as tokens

Per the Story Bible, color is a dramatic arc from warm-human → cold-clinical → verifiable-light → resolved. We express this as a fixed token set plus a per-chapter "temperature" applied via theme.

**Foundation (constant across the film):**

| Token | Role | Direction |
|-------|------|-----------|
| `void` | Primary canvas / background | Near-black with a barely-perceptible cool tint. `#05060A`-ish. The dark room. |
| `void-raised` | Elevated surfaces in dark | A half-step lighter than `void`. |
| `ink` | Primary text on light | Near-black, warm-neutral. |
| `paper` | Light surfaces (reference/docs) | Off-white, never pure `#FFF` (pure white is harsh and cheap). |
| `mist` | Secondary/recessive text | Mid neutral, ~60% on dark. |

**Narrative temperature tokens (shift by act):**

| Token | Act | Direction | Meaning |
|-------|-----|-----------|---------|
| `human` | I, V | Warm amber/ember `#E8A87C`→`#C9704B` family | Life, stakes, humanity |
| `doubt` | II, III | Cold slate / clinical grey-blue `#3A4452`→`#1C232E` | The problem, sterility |
| `verify` | IV+ (born Ch.4) | **The signature accent** — a luminous, *trustworthy* cyan-leaning light. NOT neon. Think "clean light through water," ~`#5FD4E0`/`#3FB6C9`, tuned for calm certainty. | Proof, verification, truth |
| `proof` | IV+ | Calm confirmation tone (distinct from generic UI green) | "Verified" state |
| `alarm` | Ch.6 only | A restrained signal-red, used exactly once | Rejected tampering |

**Accent discipline (the most important color rule):** `verify` is rationed like a precious metal. It appears **only** when something is sealed, witnessed, proven, or verified. If it shows up as decoration, it is a bug. The user's eye must be trained: *this color = truth.*

**Contrast:** All text meets WCAG AA minimum (4.5:1 body, 3:1 large). The dark-on-dark cinematic look must never sacrifice legibility — atmosphere never beats accessibility (Story Bible Rule 12).

### 3.2 Typography — two voices, one or two families

Per the Story Bible: type is a character. Two voices:

- **Narrator** — a confident, cinematic display family. Large, spacious, restrained. Owns full-screen statements and chapter questions. Candidate qualities: a grotesque or transitional serif/sans with strong presence and excellent large-size rendering. (Final pick in design phase; must be variable-font for weight animation.)
- **Witness** — a clean, neutral, highly legible text family for facts, depth-on-demand, and reference. Recessive, never competes with Narrator.
- **Instrument** (optional, deepest technical layers only) — a precise monospace, signaling rigor. Never appears in emotional chapters.

**Type scale (fluid, `clamp()`-based):** A deliberate, contrast-heavy scale — no flat "everything at 18px." Monumental display sizes for reflection moments; intimate sizes for supporting lines. Defined in tokens as a modular scale with viewport-fluid clamps.

| Step | Use | Direction |
|------|-----|-----------|
| `display-cinema` | Full-screen single statements | `clamp(3rem, 9vw, 9rem)`, tight leading, generous tracking control |
| `display` | Chapter titles/questions | `clamp(2.5rem, 6vw, 5rem)` |
| `headline` | Section leads | `clamp(1.75rem, 3.5vw, 3rem)` |
| `body-lg` | Lead supporting copy | `clamp(1.125rem, 1.6vw, 1.5rem)` |
| `body` | Standard supporting / reference | `1rem`–`1.125rem`, generous line-height (1.6) |
| `caption` | Data overlays, labels, meta | `0.8125rem`, tracked uppercase where appropriate |

**Type behavior rules:**
- Weight gains backbone as the story gains conviction (lighter in Acts I–II, more confident in IV–V).
- Narrator type animates like a thought arriving — soft fade/rise, never slide-flash, never bounce. The thesis line may *assemble*.
- Centered for monumental ceremony; left-aligned for utility/reference.
- One or two families maximum across the entire experience. Discipline = taste.

### 3.3 Spacing, grid & layout

- **Spacing scale:** an 8px base, geometric-ish progression (4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256). Generous by default — air is the luxury signal.
- **Grid:** a 12-column fluid grid with wide outer margins; but the film breaks the grid deliberately for full-bleed cinematic frames. Reference/docs sections obey the grid strictly; the film uses it as a guide, not a cage.
- **Frame mentality:** compose for a wide, filmic frame even in-browser. Strong centering/symmetry for gravity; deliberate asymmetry only to create tension.
- **One focal point per screen.** The eye is directed, never asked to choose.
- **Negative space is the dominant material.** When in doubt, remove.

### 3.4 Iconography & diagrams

- One geometric icon set, hairline-to-medium stroke, no filled novelty icons.
- Diagrams share the visual grammar (§2.4): clean geometry, depth, single-source light, the `verify` accent only on proven elements.
- Every diagram has a metaphor layer (default) and a depth-on-demand technical layer (expandable). Same component, two states.

---

## 4. MOTION SYSTEM

Motion is the argument. Per the Story Bible, every motion means one nameable thing. This section makes that executable.

### 4.1 The motion lexicon (named, reusable presets)

Each becomes a centralized animation preset in code (`/src/animations/presets`). No component reinvents these.

| Preset | Meaning | Character |
|--------|---------|-----------|
| `seal` | Sealing / locking-in | Smooth, continuous, final; light wraps inward |
| `witness` | Independent witnessing | Nodes ignite & connect, radiating outward |
| `anchor` | Permanence | A weighted drop with finality and settle |
| `verifyPulse` | Verification | The recurring heartbeat; a calm confirmation bloom |
| `assemble` | Proof coming together | Pieces converge into coherence |
| `mutate` | The villain (Ch.3 only) | *Too* smooth, traceless — its ease is the horror |
| `reveal` | A thought/line arriving | Soft fade + rise; never slide-flash |
| `recede` | Exit / make way | Gentle fade + slight depth push-back |

### 4.2 Timing & easing standards (centralized tokens)

- **Durations:** `instant` 120ms · `fast` 240ms · `base` 400ms · `slow` 800ms · `cinematic` 1400ms · `monumental` 2400ms+. Slow = significance; fast = technological precision.
- **Easing:** organic, weighted curves only. Defaults: `ease-out-expo`-like for entrances (decisive arrival), `ease-in-out-quart`-like for transforms (mass), gentle custom curves for the cinematic holds. **Banned:** `linear` (robotic), playful springs/bounces (cheap). Things have inertia and *settle*.
- **Stagger:** used to express sequence and assembly (witnesses igniting one-by-one); never as decoration.

### 4.3 Scroll choreography

- **Scroll is the timeline.** Forward = forward in time and understanding (Story Bible Rule 9).
- Motion is scroll-*driven* and scroll-*synchronized* where it carries narrative, so the user feels they conduct the film — but the timeline stays legible and **fully reversible**. Scrubbing back must look correct, never broken.
- **Continuity over cuts:** one chapter's final frame *transforms* into the next chapter's first. The film never "changes slides."
- **Never trap or disorient.** No scroll-jacking that fights the user. Pinning is used surgically for set-piece moments, always with a clear, recoverable exit.

### 4.4 The performance contract

- **Smoothness is non-negotiable** (Story Bible Rule 11). Target a steady 60fps on mid-tier hardware for in-view motion; degrade gracefully, never jank.
- Animate compositor-friendly properties (transform, opacity); avoid layout thrash. GPU work budgeted per scene.
- **Reduced-motion** is a first-class path: a dignified, still/cross-fade version of the entire narrative that loses none of the *meaning*, only the movement.

---

## 5. SOUND DESIGN SYSTEM

Sound is understated, cinematic, and emotional — never a soundtrack you'd notice as "background music." It is off by default (a tasteful, persistent, recessive sound toggle invites it on); when on, it deepens immersion without ever demanding attention.

### 5.1 Principles

- **No continuous music bed.** Instead: ambient environmental textures, subtle synthesized tones, restrained percussion, spatial transitions, and — critically — **deliberate silence.**
- **Silence is a tool.** At the most important moments (the Question, the Seal, Verify-It-Yourself), audio complexity *drops* so typography and image carry the weight. The reduction *is* the emphasis.
- **Sound reinforces emotional transitions**, mapped to the chapter arc: warm/organic ambience in Act I; cold, sparse, slightly unsettling textures in Acts II–III; a single clear tone at the Turn; precise, confident, rhythmic motifs in Act IV; open, resolved ambience in Act V.
- **The pulse motif** (Cold Open → returns as the verification heartbeat) is the one recurring sonic signature. It ties the film together.

### 5.2 Audio engine requirements (handed to engineering)

- Per-chapter ambient loops with crossfade on chapter transitions.
- One-shot cues bound to key motion presets (`seal`, `anchor`, `verifyPulse`) — sparingly.
- Master mute by default; user opt-in; respects OS reduce-sound where exposed; never autoplays with sound.
- Built to extend to spatial/positional audio later (e.g., witness nodes in 3D space).

---

## 6. INTERFACE & CHROME PHILOSOPHY

**The UI should be almost invisible.** Content over chrome, always.

- **Navigation never interrupts immersion.** No persistent heavy header during the film. A minimal, recessive entry point (a single mark + a way to reach reference/docs and the audio toggle) appears only when needed and dissolves back.
- **Progress is felt, not bolted on.** A subtle chapter/progress indicator keeps the user oriented in the film without shouting.
- **Controls appear on intent.** Menus, skip-to-content, and reference affordances surface when summoned, then recede.
- **Buttons are premium and tactile.** Few in number, intentional, with weighted micro-feedback (subtle scale/press, the `verifyPulse` on confirm actions). No flat default buttons; no button spam.
- **Microinteractions reinforce craft.** Hover = "look closer" (reveals truth/detail), never gratuitous effects. The cursor is a flashlight in the dark chapters.
- **The film, then the document.** Conventional site needs (technical deep-dive, security/architecture, team, contact, legal) live *past* the film and via the recessive entry point — never interrupting the narrative.

---

## 7. COMPONENT GRAMMAR (DESIGN ↔ ENGINEERING CONTRACT)

One cohesive library; every component shares APIs, styling conventions, accessibility, and animation hooks (full inventory in [TECHNICAL-ARCHITECTURE.md](./TECHNICAL-ARCHITECTURE.md)). Design intent per family:

- **Typography components** — encode the Narrator/Witness voices and the type scale; carry the `reveal`/`assemble` behaviors as props, not ad-hoc.
- **Layout & Frame** — full-bleed cinematic frame, grid section, and the "single statement in the dark" layout as first-class primitives.
- **Buttons & links** — one premium button with intent variants; the tactile micro-feedback is built in, not reapplied.
- **Overlays, cards, modals** — recessive, glass-free, used rarely; for depth-on-demand and reference only.
- **Diagrams & interactive demos** — the witness network, append-only ledger, the seal, verify-it-yourself; each with metaphor + technical states, touch/keyboard parity, and shared visual grammar.
- **Cursor, particles, indicators, loaders** — atmospheric system pieces; all meaningful, all reduced-motion aware.
- **Chapter shell** — the standardized scene wrapper (entry / idle / interaction / exit / cleanup) every chapter implements, so all nine read as one film.

---

## 8. RESPONSIVE & ADAPTIVE ART DIRECTION

Responsiveness is *designed*, not scaled (Story Bible spirit + Prompt 3 mandate):

- **Cinematic desktop** — the full experience: 3D, parallax, full-bleed frames, the works.
- **Laptop** — full narrative, tuned density and 3D cost.
- **Tablet** — narrative intact; simplified 3D; touch-first interactions for the demos.
- **Mobile** — narrative continuity preserved above all. 3D may simplify to optimized 2D/canvas or lighter scenes; type scale, spacing, and motion timing re-composed for the format. **No chapter is dropped; the film survives on every device.**

---

## 9. THE CREATIVE GOVERNANCE LOOP

For every deliverable, in every phase, run the loop:

1. State which **chapter** and which **emotional beat** it serves (cite the Story Bible).
2. Name the **one thing** the element communicates (Story Bible Rule 1 & 4).
3. Run the **Four Governing Questions** (§1).
4. Check it against the **forbidden list** (§2.3) and the **accent discipline** (§3.1).
5. Confirm **accessibility** and **reduced-motion** paths exist.
6. If it adds complexity without adding meaning, **cut it.**

> **This document, with the Story Bible, is the single source of truth for all design, motion, sound, copy, and branding decisions. The Technical Architecture translates it into systems. When in conflict: Story Bible > Creative Direction System > Technical Architecture — or the higher document is explicitly amended. Nothing is quietly overridden.**

---

*End of Creative Direction System v1.0.*
