"use client";

/**
 * Scroll Sound — synthesized, asset-free scroll cues (CDS §5, extended).
 *
 * The film wants a soft sonic texture as the viewer scrolls: a quiet, filtered
 * "tick" on movement plus a low ambient pad that breathes with scroll velocity.
 * All sound is generated with the Web Audio API so it works with zero audio files
 * and stays tiny. Entirely graceful — if the AudioContext can't start (autoplay
 * policy, unsupported env) every method no-ops.
 *
 * Must be unlocked by a user gesture: call `unlock()` from a click/tap (the boot
 * "Begin" button does this).
 */
class ScrollSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private padGain: GainNode | null = null;
  private padOsc: OscillatorNode | null = null;
  private enabled = false;
  private lastTick = 0;
  private padTarget = 0;
  private idleTimer: number | null = null;

  /** Create + resume the context from a user gesture. Safe to call repeatedly. */
  unlock(): void {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      try {
        this.ctx = new Ctor();
      } catch {
        return;
      }
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      this.buildPad();
    }
    void this.ctx.resume().catch(() => {});
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.silencePad();
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(enabled ? 0.42 : 0, now + 0.6);
    if (enabled) void this.ctx.resume().catch(() => {});
  }

  /**
   * Drive the texture from scroll. `progress` is whole-experience 0..1; `velocity`
   * is the |delta| of progress this frame. Fires a sparse tick on motion and feeds
   * the ambient pad. Cheap and throttled — safe to call every scroll event.
   */
  onScroll(progress: number, velocity: number): void {
    if (!this.enabled || !this.ctx) return;
    const v = Math.min(1, velocity * 140);
    this.padTarget = 0.015 + v * 0.06;
    this.rampPad();

    // Fade the pad fully out shortly after scrolling stops — without this the
    // 56Hz drone would hold at a faint floor forever.
    if (this.idleTimer !== null) window.clearTimeout(this.idleTimer);
    this.idleTimer = window.setTimeout(() => {
      this.idleTimer = null;
      this.silencePad();
    }, 350);

    const now = this.ctx.currentTime;
    // Sparse, velocity-gated ticks — much rarer and quieter so it reads as a
    // faint texture, never a metronome.
    const minGap = 0.32;
    if (v > 0.16 && now - this.lastTick > minGap) {
      this.lastTick = now;
      // Pitch rises gently as you move deeper into the film.
      this.tick(170 + progress * 280, 0.02 + v * 0.04);
    }
  }

  /** A single soft, filtered tick — the per-scroll cue. */
  private tick(freq: number, gain: number): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.8, t + 0.12);
    lp.type = "lowpass";
    lp.frequency.value = 1400;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.min(0.1, gain), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(lp).connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  private buildPad(): void {
    if (!this.ctx || !this.master) return;
    this.padOsc = this.ctx.createOscillator();
    this.padGain = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    this.padOsc.type = "sine";
    this.padOsc.frequency.value = 56; // deep, felt-more-than-heard drone
    lp.type = "lowpass";
    lp.frequency.value = 220;
    this.padGain.gain.value = 0;
    this.padOsc.connect(lp).connect(this.padGain).connect(this.master);
    this.padOsc.start();
  }

  private rampPad(): void {
    if (!this.ctx || !this.padGain) return;
    const now = this.ctx.currentTime;
    this.padGain.gain.cancelScheduledValues(now);
    this.padGain.gain.setValueAtTime(this.padGain.gain.value, now);
    this.padGain.gain.linearRampToValueAtTime(this.padTarget, now + 0.25);
    // Decay back toward silence so the pad only swells while actively scrolling.
    this.padTarget = Math.max(0, this.padTarget * 0.6);
  }

  /** Ramp the ambient pad all the way to silence (scroll went idle / muted). */
  private silencePad(): void {
    this.padTarget = 0;
    if (!this.ctx || !this.padGain) return;
    const now = this.ctx.currentTime;
    this.padGain.gain.cancelScheduledValues(now);
    this.padGain.gain.setValueAtTime(this.padGain.gain.value, now);
    this.padGain.gain.linearRampToValueAtTime(0, now + 0.9);
  }

  dispose(): void {
    if (this.idleTimer !== null) {
      window.clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    try {
      this.padOsc?.stop();
    } catch {
      /* already stopped */
    }
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.master = null;
    this.padGain = null;
    this.padOsc = null;
  }
}

/** Shared singleton — SSR-safe (constructor touches no browser API). */
export const scrollSound = new ScrollSound();
