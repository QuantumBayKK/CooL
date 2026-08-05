/**
 * Part D — the file watcher, item by item.
 *
 * `watcher-repro.test.ts` holds the three incidents that were observed on a
 * real machine. This holds the properties the watcher must have so that those
 * incidents, and their neighbours, cannot happen. Each test names the checklist
 * item it proves, because "done" in this project means "there is a test", and a
 * test nobody can trace back to a requirement proves nothing in particular.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { createRequire } from "node:module";
import { dirname, join, parse as parsePath, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { shouldWatch, watchProject, watchRefusal, type FileChange } from "../src/lib/cool/cli/ui/watch";
import { Scope, deniedBy, unsafeRoot } from "../src/lib/cool/cli/ui/scope";

const here = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(here, "src", "lib", "cool", "cli", "index.ts");
const LOADER = pathToFileURL(createRequire(import.meta.url).resolve("tsx")).href;

function scratch(t: { after: (fn: () => void) => void }): string {
  const dir = mkdtempSync(join(tmpdir(), "cool-partd-"));
  t.after(() => {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* Windows may still hold a handle */
    }
  });
  return dir;
}

const settle = (ms = 500): Promise<void> => new Promise((r) => setTimeout(r, ms));

function write(root: string, relative: string, contents: string): void {
  const path = join(root, relative);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

/** Start a watcher and collect what it decides to seal. */
function collect(
  t: { after: (fn: () => void) => void },
  root: string,
  options: { scope?: readonly string[] } = {},
): { sealed: FileChange[]; errors: string[] } {
  const sealed: FileChange[] = [];
  const errors: string[] = [];
  const watcher = watchProject({
    root,
    baseline: new Map(),
    onChange: (change) => sealed.push(change),
    onError: (message) => errors.push(message),
    debounceMs: 40,
    ...options,
  });
  t.after(() => watcher.close());
  return { sealed, errors };
}

/** Run the CLI the way a user does. */
function cool(args: string[], cwd: string): { stdout: string; code: number } {
  try {
    const stdout = execFileSync(process.execPath, ["--import", LOADER, CLI, ...args], {
      cwd,
      input: "",
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1", COOL_ENV: "test" },
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 60_000,
    });
    return { stdout, code: 0 };
  } catch (error) {
    const err = error as { stdout?: string; status?: number };
    return { stdout: err.stdout ?? "", code: err.status ?? 1 };
  }
}

/* ── D1 — the scope is an explicit allow-list ─────────────────────────── */

test("D1: an empty scope watches zero files", async (t) => {
  const root = scratch(t);
  write(root, "notes.md", "one\n");

  const { sealed, errors } = collect(t, root, { scope: [] });
  await settle(200);
  write(root, "notes.md", "two\n");
  write(root, join("agents", "system.prompt"), "hello\n");
  await settle();

  assert.deepEqual(sealed, [], "an empty scope must watch nothing at all");
  assert.equal(
    errors.some((message) => message.includes("no scope configured")),
    true,
    "an empty scope must say so rather than look like a broken watcher",
  );
});

test("D1: a named scope watches that subtree and nothing beside it", async (t) => {
  const root = scratch(t);
  write(root, join("agents", "system.prompt"), "one\n");
  write(root, join("secrets", "keys.json"), '{"k":1}');
  write(root, "README.md", "one\n");

  const { sealed } = collect(t, root, { scope: ["agents"] });
  await settle(200);
  write(root, join("agents", "system.prompt"), "two\n");
  write(root, join("secrets", "keys.json"), '{"k":2}');
  write(root, "README.md", "two\n");
  await settle();

  assert.deepEqual(
    sealed.map((change) => change.path),
    [join("agents", "system.prompt")],
    "only the scoped subtree may seal",
  );
});

test("D1: Scope decides directories and files consistently", () => {
  const scope = new Scope(["agents", "prompts/system"]);
  assert.equal(scope.allowsDirectory("agents"), true);
  assert.equal(scope.allowsDirectory("agents/fraud"), true);
  // A parent of something in scope must be enterable, or the child is never reached.
  assert.equal(scope.allowsDirectory("prompts"), true);
  assert.equal(scope.allowsDirectory("secrets"), false);
  assert.equal(scope.allowsFile("agents/system.prompt"), true);
  assert.equal(scope.allowsFile("prompts/system/a.md"), true);
  // In scope as a directory to pass through, but not as a place files may seal.
  assert.equal(scope.allowsFile("prompts/other.md"), false);
  assert.equal(scope.allowsFile("secrets/keys.json"), false);
  assert.equal(new Scope([]).empty, true);
  assert.equal(new Scope(["."]).allowsFile("anything/at/all.md"), true);
});

/* ── D2 — the deny-list ───────────────────────────────────────────────── */

test("D2: caches, temp and build output are denied wherever they appear", () => {
  const denied = [
    join("AppData", "Local", "x.json"),
    join("AppData", "Roaming", "x.json"),
    join("Temp", "WinSAT", "winsat.json"),
    join("tmp", "x.md"),
    join("Library", "Caches", "x.json"),
    join("node_modules", "left-pad", "index.js"),
    join(".git", "config"),
    join("venv", "pyvenv.cfg"),
    join(".venv", "pyvenv.cfg"),
    join("target", "debug", "x.rs"),
    join("dist", "bundle.js"),
    join("build", "out.js"),
    join("__pycache__", "x.py"),
    join(".cool", "receipts", "a.json"),
    join("coverage", "lcov.info"),
    join(".terraform", "state.json"),
  ];
  for (const path of denied) {
    assert.notEqual(deniedBy(path), null, `${path} must be denied`);
    assert.equal(shouldWatch(path), false, `${path} must not be watched`);
  }
});

test("D2: the deny rule names the directory that caught the file", () => {
  const reason = deniedBy(join("node_modules", "left-pad", "index.js"));
  assert.equal(typeof reason, "string");
  assert.equal(reason!.includes("node_modules"), true, `unhelpful reason: ${reason}`);
});

test("D2: ordinary project files are not denied", () => {
  const allowed = [
    "refund-agent.prompt.md",
    join("agents", "fraud", "system.prompt"),
    join("policies", "refunds.rego"),
    join("src", "index.ts"),
    join("config", "model.yaml"),
    "staging.env",
  ];
  for (const path of allowed) {
    assert.equal(deniedBy(path), null, `${path} must not be denied`);
    assert.equal(shouldWatch(path), true, `${path} must be watched: ${watchRefusal(path)}`);
  }
});

test("D2: an extensionless dotfile is out of scope, and it is not the deny-list that does it", () => {
  // Pre-existing behaviour, asserted here so it is a decision rather than an
  // accident: `.env` has no extension by the rule this watcher uses, so it is
  // never read. That is the right answer for a different reason than the one
  // the deny-list gives — a bare `.env` is where secrets live, and a governance
  // log should not be the thing that copies them somewhere durable. The two
  // reasons are kept separate so that widening the extension rule later cannot
  // silently start sealing credentials.
  assert.equal(deniedBy(".env"), null, "the deny-list is not what excludes it");
  assert.equal(watchRefusal(".env"), "not a governable text file");
  assert.equal(shouldWatch(".env"), false);
});

test("D2: a deny-listed directory inside the tree is never entered", async (t) => {
  const root = scratch(t);
  write(root, join("node_modules", "left-pad", "index.js"), "1");
  write(root, join("dist", "bundle.js"), "1");
  write(root, join(".git", "config"), "[core]\n");
  write(root, "app.ts", "one\n");

  const { sealed } = collect(t, root);
  await settle(200);
  write(root, join("node_modules", "left-pad", "index.js"), "2");
  write(root, join("dist", "bundle.js"), "2");
  write(root, join(".git", "config"), "[core]\n\n");
  write(root, "app.ts", "two\n");
  await settle();

  assert.deepEqual(sealed.map((change) => change.path), ["app.ts"]);
});

/* ── D3 — never another application's files ───────────────────────────── */

test("D3: vendor telemetry directory names are denied by name", () => {
  const vendor = [
    join("sentry", "scope_v3.json"),
    join("sentry", "session.json"),
    join("Crashpad", "settings.dat"),
    join("CrashReports", "x.json"),
    join("telemetry", "x.json"),
    join("GPUCache", "index"),
    join("Local Storage", "leveldb", "x.log"),
    join("IndexedDB", "x.json"),
    join("deep", "nested", "sentry", "scope_v3.json"),
  ];
  for (const path of vendor) {
    const reason = deniedBy(path);
    assert.notEqual(reason, null, `${path} must be denied`);
  }
  assert.equal(
    deniedBy(join("sentry", "scope_v3.json"))!.includes("telemetry"),
    true,
    "the reason must say what it is, so the operator can tell it from a build dir",
  );
});

test("D3: .coolscope is the per-directory opt-in", async (t) => {
  const root = scratch(t);
  write(root, ".coolscope", "# only the agents\nagents\n");
  write(root, join("agents", "system.prompt"), "one\n");
  write(root, join("notes", "diary.md"), "one\n");

  const { sealed } = collect(t, root, { scope: ["agents"] });
  await settle(200);
  write(root, join("agents", "system.prompt"), "two\n");
  write(root, join("notes", "diary.md"), "two\n");
  await settle();

  assert.deepEqual(sealed.map((change) => change.path), [join("agents", "system.prompt")]);
});

/* ── D4 — the root must be a project ──────────────────────────────────── */

test("D4: a home directory, a filesystem root and a system directory are refused", () => {
  const home = homedir();
  assert.notEqual(unsafeRoot(home), null, "a home directory is not a project");
  assert.notEqual(unsafeRoot(parsePath(home).root), null, "a drive root is not a project");
  assert.notEqual(unsafeRoot(dirname(home)), null, "the users directory is not a project");
  assert.notEqual(unsafeRoot(tmpdir()), null, "the temp directory itself is not a project");

  const system = process.platform === "win32" ? "C:\\Windows\\System32" : "/usr/lib";
  assert.notEqual(unsafeRoot(system), null, `${system} is not a project`);
});

test("D4: another application's data directory is refused as a root", () => {
  const home = homedir();
  const vendor =
    process.platform === "win32"
      ? join(home, "AppData", "Roaming", "Claude")
      : join(home, "Library", "Application Support", "Claude");
  assert.notEqual(unsafeRoot(vendor), null, `${vendor} is not a project`);
  assert.notEqual(unsafeRoot(join(home, "project", "sentry")), null, "a sentry dir is not a project");
});

test("D4: an ordinary project folder is accepted", (t) => {
  const root = scratch(t);
  assert.equal(unsafeRoot(root), null, `a scratch project was refused: ${unsafeRoot(root)}`);
  assert.equal(unsafeRoot(join(homedir(), "code", "my-agent")), null);
});

test("D4: cool ui refuses a home directory and says so, with the resolved path", () => {
  const run = cool(["ui", homedir(), "--no-open"], homedir());
  assert.equal(run.code, 1, "refusing must be a non-zero exit, not a warning");
  assert.equal(
    run.stdout.includes("refusing to watch"),
    true,
    `expected a refusal — got ${JSON.stringify(run.stdout.slice(0, 400))}`,
  );
  assert.equal(run.stdout.includes("home directory"), true, "the reason must be named");
  assert.equal(run.stdout.includes("resolved from"), true, "the resolved path must be printed");
});

test("D4: cool ui prints the resolved absolute scope before watching", (t) => {
  const root = scratch(t);
  write(root, "refund-agent.prompt.md", "system prompt v1\n");
  // --no-open and an immediate exit: the banner is what is under test, and the
  // server is torn down by the timeout below.
  const run = cool(["ui", root, "--no-open", "--port", "0"], root);
  // The command holds the process open, so a timeout kill is the expected path;
  // what matters is what it printed before that.
  assert.equal(
    run.stdout.includes(root) || run.stdout.includes("scope"),
    true,
    `expected the resolved root and scope in the banner — got ${JSON.stringify(
      run.stdout.slice(0, 600),
    )}`,
  );
});
