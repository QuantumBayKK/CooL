import "server-only";

import { REPO, parseIssue, type Issue } from "./github-parse";

/**
 * Public, read-only GitHub data for community projects. Fetched on the server and cached for five
 * minutes, so one request serves every visitor (unauthenticated GitHub allows 60 requests an hour
 * per IP). Phase 4 replaces this with a GitHub App and webhook-fed read models.
 */
export type { Issue };
export type IssueResult = { ok: true; issues: Issue[]; fetchedAt: string } | { ok: false; reason: "rate_limited" | "unavailable" };

export async function openIssues(repo: string): Promise<IssueResult> {
  if (!REPO.test(repo)) return { ok: false, reason: "unavailable" };
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues?state=open&per_page=50&sort=updated`, {
      headers: { accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": "northwind-cipher-community" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 403 || res.status === 429) return { ok: false, reason: "rate_limited" };
    if (!res.ok) return { ok: false, reason: "unavailable" };
    const body: unknown = await res.json();
    if (!Array.isArray(body)) return { ok: false, reason: "unavailable" };
    const issues = body.map((x) => parseIssue(x, repo)).filter((x): x is Issue => x !== null);
    return { ok: true, issues, fetchedAt: new Date().toISOString() };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
