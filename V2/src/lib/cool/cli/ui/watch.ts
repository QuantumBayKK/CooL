/**
 * Watching a real project folder.
 *
 * The website's demo fires its cascade off a React state change. This fires off
 * `fs.watch`, on files the user actually owns, which introduces three problems a
 * browser never has — and each one is a correctness problem rather than a
 * cosmetic one, because whatever comes out of here gets signed.
 *
 * **Editors do not write files once.** A save in VS Code, vim or JetBrains can
 * produce a rename, a truncate-and-write, and two or three `change` events in a
 * handful of milliseconds. Sealing each of those would put three near-identical
 * records in the log and make the tree lie about how many changes happened. So
 * events are debounced per path, and the file is only read once it has stopped
 * moving.
 *
 * **A file whose content did not change is not a change.** `touch`, a formatter
 * that rewrites identical bytes, and an editor that saves on focus-loss all fire
 * events. The content is compared against the last known bytes and identical
 * writes are dropped before anything is signed.
 *
 * **Most of a project is not worth recording.** `node_modules`, `.git`, build
 * output and — importantly — `.cool` itself are skipped. Watching `.cool` would
 * be a genuine feedback loop: sealing a record writes a receipt, which fires a
 * watch event, which seals a record.
 */
import {
  readFileSync,
  readdirSync,
  statSync,
  watch,
  type Dirent,
  type FSWatcher,
} from "node:fs";
import { join, relative } from "node:path";
import type { ChangeKind } from "../../phala/types";
import { Scope, deniedBy, directoryDeniedBy } from "./scope";

/** Extensions worth treating as governable text. */
const TEXT_EXT = new Set([
  ".prompt", ".txt", ".md", ".mdx",
  ".json", ".yaml", ".yml", ".toml", ".ini", ".env",
  ".ts", ".js", ".tsx", ".jsx", ".py", ".rb", ".go", ".rs", ".java", ".cs",
  ".jinja", ".j2", ".tpl", ".hbs", ".mustache",
  ".rego", ".cue",
]);

/** Anything larger is not a prompt or a config, and hashing it helps nobody. */
const MAX_BYTES = 512 * 1024;

/**
 * Why a path is not watched, or null when it is.
 *
 * The reason is carried rather than discarded because "your file did not seal"
 * is a question an operator will ask, and "it is in a set somewhere" is not an
 * answer. The deny rules themselves live in `scope.ts`.
 */
export function watchRefusal(relPath: string): string | null {
  const denied = deniedBy(relPath);
  if (denied) return denied;

  const parts = relPath.split(/[\\/]/).filter((part) => part.length > 0 && part !== ".");
  // Dot-directories are skipped; dotfiles are not. Configuration is exactly
  // what a governance tool should notice, and most of it is a dotfile.
  if (parts.slice(0, -1).some((part) => part.startsWith("."))) {
    return "a hidden directory";
  }

  const name = parts.at(-1) ?? "";
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : "";
  if (!TEXT_EXT.has(ext)) return "not a governable text file";
  return null;
}

export function shouldWatch(relPath: string): boolean {
  return watchRefusal(relPath) === null;
}

/**
 * What kind of change a path represents.
 *
 * Inference from the path, not from the diff. It is deliberately conservative:
 * `prompt` is the fallback for prose because that is the kind whose production
 * rules require two approvers, and guessing *down* into a laxer kind would
 * quietly route a real change past the rule that should have caught it.
 */
export function kindFor(relPath: string): ChangeKind {
  const p = relPath.toLowerCase().split(/[\\/]/).join("/");
  const name = p.split("/").at(-1) ?? "";

  if (/(^|\/)(policies|policy|governance)\//.test(p) || name.endsWith(".rego")) return "policy";
  if (/(^|\/)(datasets?|data|fixtures)\//.test(p)) return "dataset";
  if (/(tool|function)s?\.(json|ya?ml|ts|js)$/.test(name)) return "tool";
  if (/(permission|scope|role|acl)s?\./.test(name)) return "agent-permission";
  if (/(^|\/)(models?)\//.test(p) || /model\.(json|ya?ml)$/.test(name)) return "model";
  if (/\.(json|ya?ml|toml|ini|env)$/.test(name)) return "params";
  return "prompt";
}

/**
 * A stable reference for the thing that changed.
 *
 * The ref is what ties every record about one artefact together over time, so
 * it must not move when the working directory does. Path relative to the
 * project root, POSIX separators, with the extension dropped — `agents/fraud/
 * system.prompt` becomes `agents/fraud/system#prompt`.
 */
export function refFor(relPath: string): string {
  const posix = relPath.split(/[\\/]/).join("/");
  const dot = posix.lastIndexOf(".");
  if (dot <= 0) return `${posix}#file`;
  return `${posix.slice(0, dot)}#${posix.slice(dot + 1)}`;
}

export interface FileChange {
  /** Path relative to the project root, with the platform's separators. */
  readonly path: string;
  readonly ref: string;
  readonly kind: ChangeKind;
  readonly before: string | null;
  readonly after: string;
  readonly at: number;
}

export interface WatchOptions {
  readonly root: string;
  /** Previous contents by relative path — seeded from git where possible. */
  readonly baseline: Map<string, string>;
  readonly onChange: (change: FileChange) => void;
  /** Quiet period after the last event before a file is read. */
  readonly debounceMs?: number;
  readonly onError?: (message: string) => void;
  /**
   * Directories, relative to the root, that may be watched.
   *
   * Defaults to `["."]` — the whole project — which is only reached after the
   * caller has established that the root is a project at all. An empty array
   * watches nothing, deliberately: an operator who configured no scope asked
   * for no coverage, and substituting "everything" for "nothing" is precisely
   * the mistake that sealed another application's telemetry.
   */
  readonly scope?: readonly string[];
}

/** Read a file as text, or null if it is gone, huge, or binary. */
function readText(path: string): string | null {
  try {
    const stat = statSync(path);
    if (!stat.isFile() || stat.size > MAX_BYTES) return null;
    const text = readFileSync(path, "utf8");
    // A NUL byte in the first chunk is the standard cheap binary test, and it
    // matters because a signed record should never carry a commitment to bytes
    // we could not have shown an auditor as text.
    if (text.slice(0, 8000).includes("\0")) return null;
    return text;
  } catch {
    return null;
  }
}

export interface Watcher {
  close(): void;
}

export function watchProject(options: WatchOptions): Watcher {
  const { root, baseline, onChange } = options;
  const debounceMs = options.debounceMs ?? 180;
  const pending = new Map<string, NodeJS.Timeout>();
  const scope = new Scope(options.scope ?? ["."]);

  const settle = (relPath: string, absolute: string) => {
    const after = readText(absolute);
    if (after === null) return;
    const before = baseline.get(relPath) ?? null;
    if (before === after) return;
    baseline.set(relPath, after);
    onChange({
      path: relPath,
      ref: refFor(relPath),
      kind: kindFor(relPath),
      before,
      after,
      at: Date.now(),
    });
  };

  const queue = (relPath: string) => {
    if (!scope.allowsFile(relPath)) return;
    if (!shouldWatch(relPath)) return;
    const absolute = join(root, relPath);
    const existing = pending.get(relPath);
    if (existing) clearTimeout(existing);
    pending.set(
      relPath,
      setTimeout(() => {
        pending.delete(relPath);
        settle(relPath, absolute);
      }, debounceMs),
    );
  };

  /**
   * One watcher per directory, not one recursive watcher over the tree.
   *
   * `fs.watch(dir, { recursive: true })` is the obvious implementation and it
   * cannot be used here. On Windows it can abort the entire process from inside
   * libuv — `Assertion failed: !_wcsnicmp(filename, dir, dirlen)` in
   * `src/win/fs-event.c` — when the path the events describe does not share a
   * prefix with the path it was handed, which happens with 8.3 short names,
   * junctions and some temp locations. An assertion is not an exception: it
   * cannot be caught, and it would take down the host application that merely
   * wanted to seal a record.
   *
   * Watching each directory flatly avoids that code path entirely, works
   * identically on Linux and macOS, and has the side benefit of never watching
   * the directories we already know to skip — recursive mode delivers those
   * events regardless of any filter, because the filtering happens after libuv
   * has already walked them.
   */
  const watchers = new Map<string, FSWatcher>();

  /** Whether a directory, by absolute path, may be entered at all. */
  const mayEnter = (dir: string): boolean => {
    const rel = relative(root, dir);
    if (rel.startsWith("..")) return false;
    if (directoryDeniedBy(rel) !== null) return false;
    return scope.allowsDirectory(rel);
  };

  const watchDir = (dir: string, depth: number): void => {
    if (watchers.has(dir) || depth > 12) return;
    if (!mayEnter(dir)) return;
    let handle: FSWatcher;
    try {
      handle = watch(dir, (_event, filename) => {
        if (!filename) return;
        const name = String(filename);
        const childAbs = join(dir, name);
        const rel = relative(root, childAbs);
        if (rel.startsWith("..")) return;

        // A new directory has to start being watched, or everything created
        // inside it afterwards is invisible.
        try {
          if (statSync(childAbs).isDirectory()) {
            watchDir(childAbs, depth + 1);
            return;
          }
        } catch {
          // Deleted between the event and the stat — nothing to seal.
          return;
        }
        queue(rel);
      });
    } catch (error) {
      // A directory we cannot watch (permissions, a vanishing temp dir) is not
      // fatal: everything else keeps working, and the rest of the tree is still
      // covered.
      options.onError?.(`cannot watch ${relative(root, dir) || "."}: ${(error as Error).message}`);
      return;
    }
    handle.on("error", () => {
      watchers.delete(dir);
      try {
        handle.close();
      } catch {
        /* already gone */
      }
    });
    watchers.set(dir, handle);

    // A directory can be watchable and still not be listable — Windows grants
    // those rights separately, and `Temp\WinSAT` is the everyday example. An
    // unlistable directory must cost us that directory, not the recursion:
    // letting this throw would abandon every sibling that had not been reached
    // yet, which is a silent coverage gap in a tool whose whole claim is that
    // gaps are visible.
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      options.onError?.(
        `cannot list ${relative(root, dir) || "."}: ${(error as Error).message}`,
      );
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      watchDir(join(dir, entry.name), depth + 1);
    }
  };

  if (scope.empty) {
    // Not an error and not a warning to be talked out of: an empty scope is a
    // configured refusal to watch anything, and it is honoured exactly.
    options.onError?.("no scope configured — watching nothing");
  } else {
    try {
      for (const entry of scope.entries) {
        watchDir(entry === "." ? root : join(root, entry), 0);
      }
    } catch (error) {
      options.onError?.(
        `live watching unavailable on this filesystem (${(error as Error).message})`,
      );
    }

    if (watchers.size === 0) {
      options.onError?.("no directories could be watched — the console will not update by itself");
    }
  }

  return {
    close() {
      for (const timer of pending.values()) clearTimeout(timer);
      pending.clear();
      for (const handle of watchers.values()) {
        try {
          handle.close();
        } catch {
          /* already gone */
        }
      }
      watchers.clear();
    },
  };
}

/** Relative path helper that keeps the platform's separators. */
export function relativeTo(root: string, absolute: string): string {
  return relative(root, absolute);
}
