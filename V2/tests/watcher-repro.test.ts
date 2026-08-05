/**
 * The three watcher bugs that were observed in a real terminal, as tests.
 *
 * These exist to fail. Each one encodes a thing that actually happened on a
 * developer's machine, so that "it is fixed" stops being a claim and becomes an
 * exit code. They are kept separate from the wider Part-D suite because their
 * job is narrower: not "the watcher is well behaved" but "this specific
 * incident cannot recur".
 *
 *   1. Run from a home directory, the watcher walked the entire user profile
 *      and sealed other applications' internal files — Claude Desktop's and
 *      ChatGPT Desktop's Sentry telemetry (`sentry/scope_v3.json`,
 *      `sentry/session.json`), repeatedly, auto-approved by POL-001. Reading
 *      and signing another vendor's user data is a privacy incident, not a
 *      cosmetic bug.
 *
 *   2. Walking that same tree, it hit `Temp\WinSAT` and died with
 *      `EPERM: operation not permitted, watch ...`. A directory the operating
 *      system will not let us read is an ordinary condition on Windows; it must
 *      be skipped and reported, not fatal.
 *
 *   3. Ctrl-C printed `cool: readline was closed` instead of exiting. The
 *      interactive session's async iterator rejects when readline's own SIGINT
 *      handling closes the interface underneath it, and that rejection escaped
 *      all the way to the top-level catch.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { shouldWatch, watchProject, type FileChange } from "../src/lib/cool/cli/ui/watch";

const here = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(here, "src", "lib", "cool", "cli", "index.ts");
const LOADER = pathToFileURL(createRequire(import.meta.url).resolve("tsx")).href;

/** A throwaway directory that cleans itself up when the test ends. */
function scratch(t: { after: (fn: () => void) => void }): string {
  const dir = mkdtempSync(join(tmpdir(), "cool-watch-"));
  t.after(() => {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* Windows sometimes still holds a handle; the OS reaps it later. */
    }
  });
  return dir;
}

/** Give the watcher time to notice, debounce and settle. */
const settle = (ms = 500): Promise<void> => new Promise((r) => setTimeout(r, ms));

function write(root: string, relative: string, contents: string): void {
  const path = join(root, relative);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

/* ── bug 1 — other applications' files were sealed ────────────────────── */

test("repro 1a: vendor telemetry paths are not watchable paths", () => {
  // Exactly the paths from the incident, in the shape `relative()` produces on
  // the platform running the test.
  const incident = [
    join("AppData", "Roaming", "Claude", "sentry", "scope_v3.json"),
    join("AppData", "Roaming", "ChatGPT", "sentry", "session.json"),
    join("AppData", "Local", "Temp", "WinSAT", "winsat.json"),
    join("Library", "Caches", "com.example.app", "state.json"),
    join(".config", "SomeApp", "settings.json"),
  ];

  for (const path of incident) {
    assert.equal(shouldWatch(path), false, `${path} must never be watched`);
  }
});

test("repro 1b: a sentry telemetry file inside the watched tree is never sealed", async (t) => {
  const root = scratch(t);
  const sealed: FileChange[] = [];

  // The directories exist before the watcher starts, which is the incident's
  // shape: the tree was already on disk and the watcher walked into it.
  write(root, join("sentry", "scope_v3.json"), '{"generation":1}');
  write(root, join("node_modules", "left-pad", "index.js"), "module.exports = 1;");
  write(root, "refund-agent.prompt.md", "system prompt v1\n");

  const watcher = watchProject({
    root,
    baseline: new Map(),
    onChange: (change) => sealed.push(change),
    debounceMs: 40,
  });
  t.after(() => watcher.close());

  await settle(200);

  // Every one of these fires a filesystem event. Only the last is ours.
  write(root, join("sentry", "scope_v3.json"), '{"generation":2}');
  write(root, join("node_modules", "left-pad", "index.js"), "module.exports = 2;");
  write(root, "refund-agent.prompt.md", "system prompt v2\n");

  await settle();

  const paths = sealed.map((change) => change.path);
  assert.deepEqual(
    paths.filter((p) => p.includes("sentry")),
    [],
    "another application's telemetry was sealed",
  );
  assert.deepEqual(
    paths.filter((p) => p.includes("node_modules")),
    [],
    "a dependency's file was sealed",
  );
  assert.deepEqual(paths, ["refund-agent.prompt.md"], "only the project's own file is a change");
});

/* ── bug 2— EPERM on an unreadable directory was fatal ──────────────── */

test("repro 2: an unreadable directory is skipped and reported, never fatal", async (t) => {
  const root = scratch(t);
  const denied = join(root, "denied");
  mkdirSync(denied, { recursive: true });
  writeFileSync(join(denied, "inner.md"), "unreachable\n");
  write(root, "reachable.md", "one\n");

  // Arrange the WinSAT condition: a directory the current user cannot read.
  let arranged = false;
  if (process.platform === "win32") {
    try {
      execFileSync("icacls", [denied, "/deny", `${process.env["USERNAME"]}:(RX)`], {
        stdio: "ignore",
      });
      arranged = true;
    } catch {
      /* no permission to change permissions — reported below */
    }
  } else {
    try {
      chmodSync(denied, 0o000);
      // Running as root defeats the whole arrangement.
      arranged = process.getuid?.() !== 0;
    } catch {
      /* ignore */
    }
  }

  t.after(() => {
    try {
      if (process.platform === "win32") {
        execFileSync("icacls", [denied, "/remove:d", `${process.env["USERNAME"]}`], {
          stdio: "ignore",
        });
      } else {
        chmodSync(denied, 0o700);
      }
    } catch {
      /* best effort */
    }
  });

  if (!arranged) {
    t.skip("could not arrange an unreadable directory on this machine");
    return;
  }

  const sealed: FileChange[] = [];
  const errors: string[] = [];

  // The bug: this call threw, and the whole command died with it.
  const watcher = watchProject({
    root,
    baseline: new Map(),
    onChange: (change) => sealed.push(change),
    onError: (message) => errors.push(message),
    debounceMs: 40,
  });
  t.after(() => watcher.close());

  await settle(200);
  write(root, "reachable.md", "two\n");
  await settle();

  assert.equal(errors.length > 0, true, "the skipped directory must be reported, not swallowed");
  assert.equal(
    errors.some((message) => message.includes("denied")),
    true,
    `the report must name the directory — got ${JSON.stringify(errors)}`,
  );
  assert.deepEqual(
    sealed.map((change) => change.path),
    ["reachable.md"],
    "the rest of the tree must keep working",
  );
});

/* ── bug 3 — Ctrl-C printed "readline was closed" ─────────────────────── */

test("repro 3: interrupting the interactive session exits cleanly", async () => {
  // `cool repl` forces the session open over a pipe, which is how the loop gets
  // driven without a terminal. Closing stdin is the pipe's equivalent of the
  // interrupt: readline ends, the async iterator stops, and the session must
  // leave through its own exit path rather than through the top-level catch.
  const dir = mkdtempSync(join(tmpdir(), "cool-repl-"));
  try {
    const stdout = execFileSync(process.execPath, ["--import", LOADER, CLI, "repl"], {
      cwd: dir,
      input: "/help\n",
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1", COOL_ENV: "test" },
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 60_000,
    });
    assert.equal(
      stdout.includes("readline was closed"),
      false,
      "the session leaked readline's internal error to the operator",
    );
    assert.equal(stdout.includes("Receipts stay in"), true, "the session must run its own goodbye");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("repro 3b: a SIGINT while the session is open exits without an error line", async (t) => {
  if (process.platform === "win32") {
    // Windows has no way to deliver SIGINT to another process from Node —
    // `child.kill('SIGINT')` terminates it outright, which tests nothing. The
    // key path is covered by the in-process handler test in watcher.test.ts and
    // must additionally be checked by hand; see WATCHER_STATUS.md.
    t.skip("SIGINT cannot be delivered to a child process on Windows");
    return;
  }

  const { spawn } = await import("node:child_process");
  const dir = mkdtempSync(join(tmpdir(), "cool-sigint-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const child = spawn(process.execPath, ["--import", LOADER, CLI, "repl"], {
    cwd: dir,
    env: { ...process.env, NO_COLOR: "1", COOL_ENV: "test" },
    stdio: ["pipe", "pipe", "pipe"],
  });

  let stdout = "";
  child.stdout.on("data", (chunk) => (stdout += String(chunk)));

  await settle(4000);
  child.kill("SIGINT");

  const code = await new Promise<number>((resolveCode) => {
    child.on("exit", (exit) => resolveCode(exit ?? 0));
  });

  assert.equal(
    stdout.includes("readline was closed"),
    false,
    `interrupting printed readline's internal error — got ${JSON.stringify(stdout.slice(-400))}`,
  );
  assert.equal(code === 0 || code === 130, true, `unexpected exit code ${code}`);
});

/* Keep the import used even if the suite is trimmed. */
void sep;
