"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const OPTIONS: readonly { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "system", icon: Monitor, label: "System" },
  { value: "dark", icon: Moon, label: "Dark" },
];

/**
 * Theme control.
 *
 * A three-way segmented control rather than a two-way switch, because "system"
 * is a real preference and folding it into a binary silently overrides the
 * reader's OS setting the first time they touch the control.
 *
 * The applied class is set by the blocking script in `layout.tsx` before first
 * paint; this component only writes the preference and re-applies it. That
 * split is what prevents the white flash on a dark-mode load — a React effect
 * runs after paint, and by then the reader has already been flashed.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme((localStorage.getItem("theme") as Theme | null) ?? "system");
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
    };

    apply();
    if (theme === "system") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
  }, [theme, mounted]);

  function choose(next: Theme) {
    setTheme(next);
    if (next === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", next);
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[--radius-sm] border border-line p-0.5",
        className,
      )}
      role="radiogroup"
      aria-label="Colour theme"
    >
      {OPTIONS.map(({ value, icon: Icon, label }) => {
        // Before mount every option renders unselected. Rendering the stored
        // value on the server would be a lie — the server cannot know it — and
        // React would hydrate-mismatch on it.
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => choose(value)}
            className={cn(
              "grid size-7 place-items-center rounded-[--radius-xs]",
              "transition-colors duration-[--duration-state] ease-[--ease-out]",
              active
                ? "bg-raised text-ink"
                : "text-ink-subtle hover:text-ink",
            )}
          >
            <Icon className="size-3.5" strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * The blocking theme script.
 *
 * Runs before first paint, so the correct canvas is painted once rather than
 * corrected afterwards. Kept as a string because it must be inline — an
 * external script would be a network round-trip before paint, which is the
 * problem it exists to solve.
 *
 * Wrapped in try/catch: `localStorage` throws in a partitioned iframe and in
 * Safari's lockdown mode, and a theme preference is not worth a blank page.
 */
export const THEME_SCRIPT = `
try {
  var t = localStorage.getItem('theme');
  var d = t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches);
  if (d) document.documentElement.classList.add('dark');
} catch (e) {}
`.trim();
