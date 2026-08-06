"use client";

import { useMutation } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * One downloadable document.
 *
 * The click mints a fresh signed URL then navigates to it. `window.location`
 * rather than an anchor click or `window.open`: an anchor would need the URL to
 * exist in the DOM before the click (which is the thing we are avoiding), and
 * `window.open` is blocked as a popup when it happens after an await.
 */
export function AssetRow({
  asset,
}: {
  asset: {
    id: string;
    title: string;
    description: string;
    content_type: string;
    size_bytes: number | null;
  };
}) {
  const download = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/investor/asset/${asset.id}`, {
        method: "POST",
      });
      const body = (await res.json()) as { ok: boolean; url?: string };
      if (!body.ok || !body.url) {
        throw new Error(
          res.status === 429
            ? "Too many downloads in a short window. Pause a moment."
            : "That document could not be prepared. Tell us if it persists.",
        );
      }
      return body.url;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  return (
    <li className="flex flex-col gap-3 border-b border-line py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex min-w-0 gap-3">
        <FileText
          className="mt-0.5 size-4 shrink-0 text-ink-subtle"
          strokeWidth={1.75}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-sm text-ink">{asset.title}</p>
          {asset.description && (
            <p className="mt-0.5 text-xs text-ink-subtle">{asset.description}</p>
          )}
          <p className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-ink-subtle">
            {shortType(asset.content_type)}
            {asset.size_bytes ? ` · ${formatBytes(asset.size_bytes)}` : ""}
          </p>
          {download.isError && (
            <p role="alert" className="mt-1.5 text-xs text-fail">
              {download.error.message}
            </p>
          )}
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        className="shrink-0 self-start sm:self-auto"
        onClick={() => download.mutate()}
        disabled={download.isPending}
      >
        <Download className="size-3.5" strokeWidth={2} />
        {download.isPending ? "Preparing…" : "Download"}
      </Button>
    </li>
  );
}

function shortType(mime: string): string {
  const map: Record<string, string> = {
    "application/pdf": "PDF",
    "application/zip": "ZIP",
    "text/csv": "CSV",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "PPTX",
  };
  return map[mime] ?? mime.split("/").pop()?.toUpperCase() ?? "FILE";
}

/**
 * Binary units, labelled as binary units.
 *
 * 1024-based with KiB/MiB rather than 1000-based with KB/MB. On a page about
 * being precise, quietly using the wrong prefix for the wrong base is a small
 * lie that a technical reader will notice.
 */
function formatBytes(bytes: number): string {
  const units = ["B", "KiB", "MiB", "GiB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
}
