# Cinematic Clips

Drop footage here using the exact naming convention below. The experience runs with
tasteful placeholders until files are present, so you can add clips incrementally.

## Naming convention

```
<story>-<NN>-<role>.mp4

story : healthcare | finance | education | law | employment
NN    : 01 | 02 | 03 | 04
role  : establishing | human | ai | emotion
```

### Required files (20 story clips + transitions)

| Story | 01 establishing | 02 human | 03 ai | 04 emotion |
|-------|-----------------|----------|-------|------------|
| healthcare | `healthcare-01-establishing.mp4` | `healthcare-02-human.mp4` | `healthcare-03-ai.mp4` | `healthcare-04-emotion.mp4` |
| finance | `finance-01-establishing.mp4` | `finance-02-human.mp4` | `finance-03-ai.mp4` | `finance-04-emotion.mp4` |
| education | `education-01-establishing.mp4` | `education-02-human.mp4` | `education-03-ai.mp4` | `education-04-emotion.mp4` |
| law | `law-01-establishing.mp4` | `law-02-human.mp4` | `law-03-ai.mp4` | `law-04-emotion.mp4` |
| employment | `employment-01-establishing.mp4` | `employment-02-human.mp4` | `employment-03-ai.mp4` | `employment-04-emotion.mp4` |

Transitions (8–10): `transition-01.mp4` … `transition-10.mp4`

## Encoding guidance

- **Format:** H.264 MP4 (add a `.webm` VP9/AV1 sibling later for smaller payloads).
- **Resolution:** 1920×1080 max for web; 1280×720 is plenty for background footage.
- **Bitrate:** target a visually lossless but compressed file (~3–6 Mbps); keep each clip
  small — these are atmospheric backgrounds, not the focal point.
- **Length:** 6–10s, designed to loop cleanly (the experience crossfades, ~5–8s on screen).
- **No audio track needed** (clips play muted); strip audio to save bytes.
- Prefer **slow camera movement, shallow depth of field, natural light** (per the brief).

> The clip ids and roles are defined in `src/config/clips.manifest.ts`; the story copy
> lives in `src/features/chapter-00-opening/opening.data.ts`.
