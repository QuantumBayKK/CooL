/**
 * Where to send someone after signing in. Only same-origin paths under /community are allowed:
 * no absolute or protocol-relative URLs, no backslashes (some browsers treat `/\` as `//`),
 * no control characters. Anything else falls back.
 */
export function safeReturnPath(value: string | null | undefined, fallback = "/community/profile"): string {
  if (!value || value.length > 512) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const url = new URL(value, "https://example.invalid");
    if (url.origin !== "https://example.invalid") return fallback;
    if (url.pathname !== "/community" && !url.pathname.startsWith("/community/")) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
