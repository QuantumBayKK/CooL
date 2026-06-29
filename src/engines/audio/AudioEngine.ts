"use client";

import { type AmbientTrack, CUES, type CueName, getAmbient } from "@/config/audio.manifest";

const FADE_MS = 900;

/**
 * Audio Engine (Technical Architecture §4.5, CDS §5). Per-chapter ambient loops
 * with crossfade. Muted by default; opt-in. Entirely graceful: missing files,
 * autoplay blocks, and unsupported environments are swallowed so the film is never
 * harmed by audio. Built to extend to one-shot cues and spatial audio later.
 */
export class AudioEngine {
  private elements = new Map<string, HTMLAudioElement>();
  private fades = new Map<string, number>();
  private enabled = false;
  private activeId: string | null = null;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      if (this.activeId) this.play(this.activeId);
    } else {
      for (const el of this.elements.values()) this.fade(el, 0, () => el.pause());
    }
  }

  /** Crossfade to a chapter's ambient track. */
  play(chapterId: string): void {
    this.activeId = chapterId;
    if (!this.enabled || typeof window === "undefined") return;

    const track = getAmbient(chapterId);
    if (!track) return;

    // Fade out everything that isn't the target.
    for (const [id, el] of this.elements) {
      if (id !== chapterId) this.fade(el, 0, () => el.pause());
    }

    const el = this.ensure(track);
    el.play()
      .then(() => this.fade(el, track.volume))
      .catch(() => {
        /* autoplay blocked or file missing — ignore. */
      });
  }

  /** Fire a one-shot cue (sealing, verifying, …). No-ops when muted or file absent. */
  cue(name: CueName): void {
    if (!this.enabled || typeof window === "undefined") return;
    const descriptor = CUES[name];
    if (!descriptor) return;
    const el = new Audio(descriptor.src);
    el.volume = descriptor.volume;
    el.play().catch(() => {
      /* file missing or blocked — ignore. */
    });
  }

  dispose(): void {
    for (const id of this.fades.values()) cancelAnimationFrame(id);
    this.fades.clear();
    for (const el of this.elements.values()) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    this.elements.clear();
  }

  private ensure(track: AmbientTrack): HTMLAudioElement {
    let el = this.elements.get(track.chapterId);
    if (!el) {
      el = new Audio(track.src);
      el.loop = true;
      el.preload = "none";
      el.volume = 0;
      el.addEventListener("error", () => this.elements.delete(track.chapterId), { once: true });
      this.elements.set(track.chapterId, el);
    }
    return el;
  }

  // ---- internals ----

  private fade(el: HTMLAudioElement, to: number, onDone?: () => void): void {
    const key = el.src;
    const existing = this.fades.get(key);
    if (existing) cancelAnimationFrame(existing);

    const from = el.volume;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / FADE_MS);
      el.volume = from + (to - from) * t;
      if (t < 1) {
        this.fades.set(key, requestAnimationFrame(step));
      } else {
        this.fades.delete(key);
        onDone?.();
      }
    };
    this.fades.set(key, requestAnimationFrame(step));
  }
}

/**
 * Shared singleton so chapters can fire cues (audioEngine.cue('seal')) while the
 * provider owns ambient lifecycle. SSR-safe: the constructor touches no browser API.
 */
export const audioEngine = new AudioEngine();
