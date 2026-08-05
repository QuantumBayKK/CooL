/**
 * What the watcher is allowed to look at.
 *
 * This file exists because of an incident. `cool ui` was typed in a home
 * directory, took "the current folder" as its scope, walked the entire user
 * profile, and sealed other applications' internal files into a signed log —
 * Claude Desktop's and ChatGPT Desktop's Sentry telemetry, among them. Reading
 * another vendor's user data is bad. Signing it, timestamping it and putting it
 * in an append-only log that is designed to be hard to erase is worse: it turns
 * a bug into a data-protection problem that outlives the process.
 *
 * So the decision of "may this path be watched" is pulled out of the watcher
 * and made explicit here, where it can be read and tested on its own. Three
 * layers, in order of authority:
 *
 *   1. **The root must be a project.** Home directories, drive roots, system
 *      directories and other applications' data directories are refused
 *      outright, with a message, before anything is watched. `unsafeRoot`.
 *
 *   2. **A deny-list applies inside the tree.** Caches, build output, virtual
 *      environments, temp directories and — specifically — vendor crash and
 *      telemetry directories are never watched, wherever they appear.
 *      `deniedBy`.
 *
 *   3. **An allow-list narrows it further.** The scope is a list of directories
 *      relative to the root. An empty list watches nothing; that is a refusal,
 *      not a wildcard. `Scope`.
 *
 * The deny-list is matched against paths **relative to the watched root**, never
 * against the absolute path. That distinction matters more than it looks: a
 * scratch project legitimately lives at `%TEMP%\my-project`, and matching
 * absolutely would deny every path inside it because of a `Temp` segment that
 * belongs to the root rather than to the project.
 */
import { homedir, tmpdir } from "node:os";
import { dirname, parse, resolve, sep } from "node:path";

/* ── case sensitivity ─────────────────────────────────────────────────── */

/**
 * Windows and macOS compare paths without regard to case; Linux does not.
 *
 * Folding on the wrong platform is not cosmetic. Folding on Linux would let a
 * deny-list entry for `node_modules` also swallow a genuine directory called
 * `Node_Modules`, which is a different directory there. Not folding on Windows
 * would let `AppData\Roaming\Sentry` through because the deny-list happens to
 * spell it `sentry`.
 */
export const CASE_INSENSITIVE = process.platform === "win32" || process.platform === "darwin";

/** The form a path segment is compared in on this platform. */
export function fold(segment: string): string {
  return CASE_INSENSITIVE ? segment.toLowerCase() : segment;
}

/** Split a relative path into segments, on either separator. */
export function segments(relPath: string): string[] {
  return relPath.split(/[\\/]/).filter((part) => part.length > 0 && part !== ".");
}

/* ── layer 2: the deny-list ───────────────────────────────────────────── */

/**
 * Directory names never worth watching, matched on any segment.
 *
 * Grouped by why they are here, because "it is in a set" is not a reason and
 * the next person to add one should have to write down theirs.
 */
const DENY_SEGMENTS = new Set(
  [
    // Our own working directory. Watching it is a genuine feedback loop:
    // sealing writes a receipt, the receipt fires an event, the event seals.
    ".cool",

    // Version control internals. Fast-moving, machine-owned, and `.git/index`
    // changes on every command.
    ".git",
    ".hg",
    ".svn",
    ".bzr",

    // Dependencies. Not the user's code, and enormous.
    "node_modules",
    "bower_components",
    "vendor",
    "jspm_packages",
    "Pods",

    // Virtual environments and language toolchain caches.
    "__pycache__",
    ".venv",
    "venv",
    ".tox",
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",
    ".gradle",
    ".m2",
    ".cargo",
    ".rustup",
    ".stack-work",
    ".bundle",
    ".cpanm",

    // Package-manager caches.
    ".npm",
    ".yarn",
    ".pnpm-store",
    ".pub-cache",
    ".nuget",

    // Build output. Derived bytes; the source that produced them is watched.
    "dist",
    "build",
    "out",
    "target",
    "bin",
    "obj",
    ".next",
    ".nuxt",
    ".output",
    ".svelte-kit",
    ".astro",
    ".docusaurus",
    ".turbo",
    ".parcel-cache",
    ".webpack",
    ".vite",
    "coverage",
    ".nyc_output",

    // Infrastructure state, some of which contains secrets.
    ".terraform",
    ".serverless",
    ".vagrant",

    // Editor and IDE state.
    ".idea",
    ".vscode",
    ".vs",
    ".fleet",
    ".history",

    // Generic caches and temporary space. `Temp\WinSAT` — the directory whose
    // EPERM used to be fatal — is covered by `temp` and again by `winsat`.
    ".cache",
    "cache",
    "caches",
    "tmp",
    "temp",
    "winsat",
    ".tmp",

    // Other applications' data roots, when they turn up inside a project.
    "AppData",
    "Application Data",
    "Local Settings",
    ".local",
    ".config",

    // Operating-system litter.
    ".Trash",
    ".Trashes",
    "$RECYCLE.BIN",
    "System Volume Information",
    ".fseventsd",
    ".Spotlight-V100",
    ".DocumentRevisions-V100",
  ].map(fold),
);

/**
 * Crash-reporting and telemetry directories, by name.
 *
 * This is the specific list the incident was about. Every desktop application
 * built on Electron, Sentry, Crashpad or Breakpad writes its user's session
 * state — which can include prompts, file paths, emails and stack traces — into
 * a directory with one of these names. None of it is ours, none of it is the
 * user's deliberate work product, and all of it changes constantly.
 */
const VENDOR_TELEMETRY = new Set(
  [
    "sentry",
    ".sentry",
    "sentry-native",
    ".sentry-native",
    "crashpad",
    "Crashpad",
    "CrashReports",
    "Crash Reports",
    "crashdumps",
    "CrashDumps",
    "breakpad",
    "Breakpad",
    "minidumps",
    "telemetry",
    "Telemetry",
    "analytics",
    "diagnostics",
    "DiagnosticReports",
    "segment",
    "amplitude",
    "posthog",
    "mixpanel",
    "GPUCache",
    "Code Cache",
    "Service Worker",
    "IndexedDB",
    "Local Storage",
    "Session Storage",
    "blob_storage",
    "databases",
  ].map(fold),
);

/**
 * Two-segment deny rules.
 *
 * `Library` on its own is an ordinary word and a plausible project directory.
 * `Library/Caches` is macOS's cache root and must never be watched. Encoding
 * the pair keeps the deny-list from being either too loose or too eager.
 */
const DENY_PAIRS: readonly (readonly [string, string])[] = [
  ["library", "caches"],
  ["library", "application support"],
  ["library", "logs"],
  ["library", "containers"],
  ["library", "group containers"],
  ["appdata", "local"],
  ["appdata", "roaming"],
  ["appdata", "locallow"],
].map(([a, b]) => [fold(a!), fold(b!)] as const);

/**
 * Why a relative path may not be watched, or null when it may.
 *
 * Returns a reason rather than a boolean so the operator can be told which rule
 * caught their file. "It was ignored" is an unhelpful thing to read when you are
 * wondering why your save did not seal.
 */
export function deniedBy(relPath: string): string | null {
  const parts = segments(relPath);
  if (parts.length === 0) return null;

  // A path that climbs out of the root is out of scope by definition.
  if (parts.some((part) => part === "..")) return "outside the watched folder";

  // Only the directory components are checked against directory rules; the
  // final segment is a file name and is judged elsewhere.
  const dirs = parts.slice(0, -1);

  for (const part of dirs) {
    const folded = fold(part);
    if (VENDOR_TELEMETRY.has(folded)) {
      return `another application's telemetry directory (${part}/)`;
    }
    if (DENY_SEGMENTS.has(folded)) {
      return `a denied directory (${part}/)`;
    }
  }

  for (let i = 0; i + 1 < dirs.length; i++) {
    const a = fold(dirs[i]!);
    const b = fold(dirs[i + 1]!);
    if (DENY_PAIRS.some(([x, y]) => x === a && y === b)) {
      return `a denied directory (${dirs[i]}/${dirs[i + 1]}/)`;
    }
  }

  return null;
}

/** The same question about a directory, including its own final segment. */
export function directoryDeniedBy(relPath: string): string | null {
  const parts = segments(relPath);
  if (parts.length === 0) return null;
  // Reuse the file rule by appending a placeholder leaf, so a directory is
  // judged by exactly the rules that judge the files inside it.
  return deniedBy([...parts, "-"].join("/"));
}

/* ── layer 1: the root must be a project ──────────────────────────────── */

/** Compare two absolute paths for equality, honouring the platform's rules. */
function samePath(a: string, b: string): boolean {
  const left = a.replace(/[\\/]+$/, "");
  const right = b.replace(/[\\/]+$/, "");
  return CASE_INSENSITIVE ? left.toLowerCase() === right.toLowerCase() : left === right;
}

/** True when `child` is `parent` or lives underneath it. */
export function isWithin(parent: string, child: string): boolean {
  if (samePath(parent, child)) return true;
  const prefix = parent.replace(/[\\/]+$/, "") + sep;
  return CASE_INSENSITIVE
    ? child.toLowerCase().startsWith(prefix.toLowerCase())
    : child.startsWith(prefix);
}

/** System directories that are never a project, by absolute path. */
function systemRoots(): string[] {
  if (process.platform === "win32") {
    const drive = process.env["SystemDrive"] ?? "C:";
    return [
      `${drive}\\Windows`,
      `${drive}\\Program Files`,
      `${drive}\\Program Files (x86)`,
      `${drive}\\ProgramData`,
      `${drive}\\Users\\Public`,
      `${drive}\\$Recycle.Bin`,
    ];
  }
  return [
    "/bin",
    "/boot",
    "/dev",
    "/etc",
    "/lib",
    "/proc",
    "/sbin",
    "/sys",
    "/usr",
    "/var",
    "/opt",
    "/System",
    "/Library",
    "/private",
    "/Applications",
    "/Volumes",
  ];
}

/**
 * Why a directory may not be used as the watched root, or null when it may.
 *
 * The temp directory is a deliberate exception in one direction only: `%TEMP%`
 * itself is refused, but a named directory inside it is allowed. Scratch
 * projects live there, every test in this repository lives there, and a
 * directory somebody explicitly created and explicitly pointed at is their
 * project regardless of which parent it sits under. `%TEMP%\WinSAT` and the
 * vendor-telemetry names are still refused by the deny-list, one layer down.
 */
export function unsafeRoot(absolute: string): string | null {
  const root = resolve(absolute);
  const home = homedir();
  const temp = resolve(tmpdir());
  const inTemp = isWithin(temp, root) && !samePath(temp, root);

  if (samePath(root, parse(root).root)) {
    return `a filesystem root (${root})`;
  }
  if (samePath(root, home)) {
    return `a home directory (${root})`;
  }
  if (samePath(root, dirname(home))) {
    return `the directory that holds every user's home (${root})`;
  }
  if (samePath(root, temp)) {
    return `the system temporary directory (${root})`;
  }
  for (const system of systemRoots()) {
    if (isWithin(system, root)) return `a system directory (${system})`;
  }

  // Another application's data root. Denied unless it is the temp subtree,
  // which on Windows happens to live under `AppData\Local`.
  if (!inTemp) {
    const parts = segments(root);
    for (const part of parts) {
      const folded = fold(part);
      if (VENDOR_TELEMETRY.has(folded)) {
        return `an application's telemetry directory (${part})`;
      }
      if (
        folded === fold("AppData") ||
        folded === fold("Application Data") ||
        folded === fold("Local Settings")
      ) {
        return `another application's data directory (${part})`;
      }
    }
    for (let i = 0; i + 1 < parts.length; i++) {
      const a = fold(parts[i]!);
      const b = fold(parts[i + 1]!);
      if (DENY_PAIRS.some(([x, y]) => x === a && y === b)) {
        return `a cache directory (${parts[i]}/${parts[i + 1]})`;
      }
    }
  }

  return null;
}

/* ── layer 3: the allow-list ──────────────────────────────────────────── */

/**
 * The set of directories, relative to the root, the watcher may enter.
 *
 * `["."]` is the whole project and is what bare `cool ui` uses once the root has
 * passed `unsafeRoot`. `[]` watches nothing at all, and does so silently on
 * purpose: an operator who configured an empty scope asked for no coverage, and
 * quietly substituting "everything" is exactly the failure this file exists to
 * prevent.
 */
export class Scope {
  private readonly allowed: string[];

  constructor(entries: readonly string[]) {
    this.allowed = entries
      .map((entry) => segments(entry).join("/"))
      .filter((entry, index, all) => all.indexOf(entry) === index);
  }

  /** True when nothing at all is in scope. */
  get empty(): boolean {
    return this.allowed.length === 0;
  }

  /** The entries, for reporting at startup. */
  get entries(): readonly string[] {
    return this.allowed.map((entry) => entry || ".");
  }

  /** Whether a relative directory is, or could contain, something in scope. */
  allowsDirectory(relPath: string): boolean {
    const dir = segments(relPath).join("/");
    return this.allowed.some(
      (entry) =>
        entry === "" ||
        dir === "" ||
        dir === entry ||
        withinPosix(entry, dir) ||
        withinPosix(dir, entry),
    );
  }

  /** Whether a relative file path is inside the scope. */
  allowsFile(relPath: string): boolean {
    const parts = segments(relPath);
    const dir = parts.slice(0, -1).join("/");
    return this.allowed.some((entry) => entry === "" || dir === entry || withinPosix(entry, dir));
  }
}

function withinPosix(parent: string, child: string): boolean {
  if (parent === "") return true;
  const a = CASE_INSENSITIVE ? parent.toLowerCase() : parent;
  const b = CASE_INSENSITIVE ? child.toLowerCase() : child;
  return b === a || b.startsWith(`${a}/`);
}
