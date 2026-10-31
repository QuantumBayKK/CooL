/**
 * Form checks shared by the browser forms and their tests. The database enforces the same rules;
 * these only give a friendly message before the round trip.
 */
export const HANDLE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
export const TRIED = [
  ["used", "Yes, I've used it", "I've run CooL or built something with it."],
  ["read", "I've read about it", "I know what it does but haven't tried it yet."],
  ["not_yet", "Not yet", "I'm new to CooL and want to learn."],
] as const;
export type Tried = (typeof TRIED)[number][0];

export function nameError(v: string) {
  const n = v.trim().length;
  return n < 2 || n > 80 ? "Your name should be 2 to 80 characters." : "";
}
export function handleError(v: string) {
  return HANDLE.test(v.trim()) ? "" : "Handles are 3 to 30 characters: lowercase letters, numbers and dashes, not starting or ending with a dash.";
}
export function triedError(v: string) {
  return TRIED.some(([k]) => k === v) ? "" : "Pick one answer.";
}
export function reasonError(v: string) {
  const n = v.trim().length;
  if (n < 20) return "Tell us a little more: at least 20 characters.";
  return n > 1000 ? "Keep it under 1000 characters." : "";
}
export function usageError(v: string) {
  return v.trim().length > 500 ? "Keep it under 500 characters." : "";
}
export function bioError(v: string) {
  return v.trim().length > 280 ? "Keep your bio under 280 characters." : "";
}
/** Skills typed as a comma-separated list: trimmed, de-duplicated, at most 20 of up to 32 characters. */
export function parseSkills(v: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of v.split(",")) {
    const s = raw.trim().slice(0, 32);
    const key = s.toLowerCase();
    if (s && !seen.has(key)) {
      seen.add(key);
      out.push(s);
    }
  }
  return out.slice(0, 20);
}
