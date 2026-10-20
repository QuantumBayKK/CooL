# Film assets — provenance

All frames are derived from free stock footage under the Pexels License
(https://www.pexels.com/license/): free to use and modify, attribution not
required (given here anyway). No Pexels footage is redistributed unmodified.

| Folder      | Source clip                                                                 | Author            |
|-------------|------------------------------------------------------------------------------|-------------------|
| `hero/`     | https://www.pexels.com/video/abstract-black-cube-shapes-in-dark-space-34128902/ | Chandresh Uike    |
| `recorder/` | https://www.pexels.com/video/hard-disk-drive-19285752/                        | Lech Pierchała    |

Treatment (ffmpeg 8): greyscale → tone curve → 1-bit ordered (Bayer 2) dither
against a pure #000/#FFF palette → 640×360 monochrome PNG. `hero/` is the
clip's native 10 s loop at 12 fps (120 frames). `recorder/` is a synthetic
push-in (zoompan 1.0 → 2.4) sampled to 96 frames for scroll scrubbing.

These are illustrative footage, not product imagery: the hard drive is not a
CooL device and the page never says it is.
