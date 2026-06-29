# Audio

All audio is **off by default** and opt-in via the sound toggle. Every file here is
optional — the Audio Engine no-ops gracefully until the files exist, so the experience
runs silently without them.

## Ambient loops (one per chapter)

Drop these in `public/audio/` (manifest: `src/config/audio.manifest.ts`):

```
opening.mp3
the-question.mp3
the-quiet-edit.mp3
the-turn.mp3
the-sealed-room.mp3
the-witnesses.mp3
proof-that-outlives.mp3
the-world-rewritten.mp3
the-invitation.mp3
```

- Seamless **loops**, understated — ambient textures / sparse tones, **no melody bed**.
- The engine crossfades between chapters automatically.

## One-shot cues

Drop these in `public/audio/cues/`:

```
seal.mp3       — fires when a record is sealed (Ch.3)
verified.mp3   — fires when "Verify it yourself" completes (Ch.6)
reject.mp3     — fires when a tamper attempt is rejected (Ch.5)
tamper.mp3     — fires when the record is silently altered (Ch.2)
reveal.mp3     — reserved for line/section reveals
```

- Short (< 1.5s), restrained. A cue marks a **transformation**, never decoration.

## Encoding

- MP3 (or add `.webm`/OGG siblings later), mono is fine for ambience.
- Keep ambience small (~64–96 kbps is plenty for textural loops).
