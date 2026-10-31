import { test } from "node:test";
import assert from "node:assert/strict";

import { parseIssue } from "../src/lib/community/github-parse";

const REPO = "Northwind-Cipher/cool-sdk";
const base = { number: 7, title: "Add tests", html_url: `https://github.com/${REPO}/issues/7`, labels: [{ name: "good first issue" }], comments: 2, updated_at: "2026-10-30T00:00:00Z", user: { login: "octocat" } };

test("parses a normal issue and keeps only expected fields", () => {
  const i = parseIssue({ ...base, body: "<script>", extra: 1 }, REPO);
  assert.deepEqual(i, { number: 7, title: "Add tests", url: base.html_url, labels: ["good first issue"], comments: 2, updatedAt: base.updated_at, author: "octocat" });
});

test("drops pull requests, malformed items and links outside the repository", () => {
  assert.equal(parseIssue({ ...base, pull_request: {} }, REPO), null);
  assert.equal(parseIssue({ ...base, number: "7" }, REPO), null);
  assert.equal(parseIssue({ ...base, html_url: "https://evil.example/issues/7" }, REPO), null);
  assert.equal(parseIssue({ ...base, html_url: `https://github.com/${REPO}/issues/8` }, REPO), null);
  assert.equal(parseIssue(null, REPO), null);
});

test("caps title length and label count", () => {
  const i = parseIssue({ ...base, title: "x".repeat(500), labels: Array.from({ length: 10 }, (_, k) => ({ name: `l${k}` })) }, REPO);
  assert.equal(i!.title.length, 300);
  assert.equal(i!.labels.length, 6);
});
