"use client";

import { useRef, useState } from "react";

import { MAX_RECEIPT_BYTES } from "@/lib/receipts";

import { VerdictTerminal } from "./VerdictTerminal";

/**
 * Drop or choose a receipt file. It is read with FileReader and verified in
 * memory; it is never uploaded, and this component makes no network request.
 * Validation happens before parsing: type, size, then JSON.
 */
export function ReceiptDrop() {
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");
  const [ext, setExt] = useState<{ name: string; receipt: unknown } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const accept = async (file: File | undefined) => {
    setError("");
    if (!file) return;
    if (!/\.json$/i.test(file.name) && file.type !== "application/json") {
      setError("That is not a .json file. A CooL receipt is a JSON document.");
      return;
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      setError(`That file is ${Math.round(file.size / 1024)} KB. Receipts are well under ${MAX_RECEIPT_BYTES / 1024} KB.`);
      return;
    }
    try {
      const text = await file.text();
      setExt({ name: file.name, receipt: JSON.parse(text) });
    } catch {
      setError("The file is not valid JSON.");
    }
  };

  return (
    <div className="f-grid" style={{ alignItems: "start" }}>
      <div className="f-span-5 f-stack">
        <label
          className="f-drop"
          data-over={over}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            void accept(e.dataTransfer.files[0]);
          }}
        >
          <input
            ref={input}
            type="file"
            accept=".json,application/json"
            onChange={(e) => void accept(e.target.files?.[0])}
            aria-describedby="drop-help drop-error"
          />
          <span className="f-h3">Drop a receipt</span>
          <span className="f-label" id="drop-help">
            or click to choose · .json · up to {MAX_RECEIPT_BYTES / 1024} KB · stays in this browser
          </span>
        </label>
        <p id="drop-error" role={error ? "alert" : undefined} className="f-body f-small" style={{ minHeight: 24 }}>
          {error && `× ${error}`}
        </p>
        {ext && (
          <button type="button" className="f-btn f-btn--line" onClick={() => setExt(null)} data-impact="small">
            Back to the sample fixtures
          </button>
        )}
        <p className="f-body f-small">
          Privacy: your file is read locally with the File API and never uploaded. The only network requests this
          page makes are for its own code and, when you pick a sample, the published fixture from /cool-vectors.
        </p>
      </div>
      <div className="f-span-7">
        <VerdictTerminal external={ext} />
      </div>
    </div>
  );
}
