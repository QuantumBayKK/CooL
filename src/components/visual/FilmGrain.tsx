/**
 * A whisper of film grain across the whole experience (CDS §2.4 — "subtle, filmic"
 * texture to avoid digital flatness). Fixed, non-interactive, blended softly; sits
 * above content but below the chrome.
 */
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function FilmGrain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 opacity-[0.04] mix-blend-soft-light"
      style={{ backgroundImage: NOISE, backgroundSize: "160px 160px" }}
    />
  );
}
