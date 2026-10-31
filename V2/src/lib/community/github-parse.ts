/** Pure parsing of GitHub API responses, shared by the server fetcher and tests. */
export type Issue = {
  number: number;
  title: string;
  url: string;
  labels: string[];
  comments: number;
  updatedAt: string;
  author: string;
};

export const REPO = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;

/** Validates one GitHub API item, keeping only safe, expected fields. Pull requests are excluded. */
export function parseIssue(raw: unknown, repo: string): Issue | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if ("pull_request" in r) return null;
  const number = r.number, title = r.title, url = r.html_url;
  if (typeof number !== "number" || typeof title !== "string" || typeof url !== "string") return null;
  // Only ever link to this repository's own issue page.
  if (url !== `https://github.com/${repo}/issues/${number}`) return null;
  const labels = Array.isArray(r.labels)
    ? r.labels.map((l) => (l && typeof l === "object" && typeof (l as { name?: unknown }).name === "string" ? (l as { name: string }).name : "")).filter(Boolean).slice(0, 6)
    : [];
  const user = r.user && typeof r.user === "object" ? (r.user as { login?: unknown }).login : null;
  return {
    number,
    title: title.slice(0, 300),
    url,
    labels,
    comments: typeof r.comments === "number" ? r.comments : 0,
    updatedAt: typeof r.updated_at === "string" ? r.updated_at : "",
    author: typeof user === "string" ? user : "",
  };
}

