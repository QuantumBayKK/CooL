import { codeToHtml } from "shiki";

import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

/**
 * Server-rendered syntax highlighting.
 *
 * Shiki runs at build time on the server, so the browser receives coloured HTML
 * and zero highlighting JavaScript. The alternative — highlighting on the
 * client — ships a tokenizer and a grammar (hundreds of kB) to render text that
 * never changes, and flashes unstyled code while it loads.
 *
 * Dual themes emit both palettes as CSS variables on one set of spans, so the
 * theme toggle is a class flip with no re-highlight and no second copy of the
 * markup. The `.dark` rules that activate `--shiki-dark` live in globals.css.
 */
export async function CodeBlock({
  code,
  lang = "text",
  filename,
  className,
  copy = true,
}: {
  code: string;
  lang?: string;
  /** Rendered as a caption bar above the code. Also the copy button's context. */
  filename?: string;
  className?: string;
  copy?: boolean;
}) {
  const html = await codeToHtml(code.trim(), {
    lang,
    themes: { light: "github-light", dark: "github-dark-dimmed" },
    defaultColor: false,
    // `structure: "classic"` keeps the <pre><code> wrapper Shiki's CSS expects.
    transformers: [
      {
        pre(node) {
          // Shiki sets inline background styles that would beat our token-based
          // surface colour. Dropping the class it targets lets globals.css win.
          node.properties.class = `shiki ${node.properties.class ?? ""}`.trim();
          node.properties.tabindex = "0";
        },
      },
    ],
  });

  return (
    <figure
      className={cn(
        "overflow-hidden rounded-[--radius-md] border border-line bg-surface",
        className,
      )}
    >
      {(filename || copy) && (
        <figcaption className="flex items-center justify-between gap-4 border-b border-line px-3.5 py-2">
          <span className="truncate font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-ink-subtle">
            {filename ?? lang}
          </span>
          {copy && <CopyButton value={code.trim()} />}
        </figcaption>
      )}
      {/* `tabindex` is set on the <pre> by the transformer above: a scrollable
          region must be reachable by keyboard, or a keyboard user cannot read
          the right-hand side of a wide line. */}
      <div
        data-scroll
        className="[&_pre]:!m-0 [&_pre]:!rounded-none [&_pre]:!border-0"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </figure>
  );
}
