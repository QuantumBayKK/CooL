"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CodeRow } from "@/app/admin/(console)/codes/page";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Card, StatusBadge, type Status } from "@/components/ui/primitives";
import { Collapse } from "@/components/ui/motion";

/**
 * Issue and revoke invite codes.
 *
 * The newly-minted code is displayed in a panel that stays until dismissed and
 * says plainly that it will not be shown again. This is the one place in the
 * product where a modal-style interruption is correct: the value is
 * unrecoverable, and an admin who navigates away without copying it has burned
 * a code and has to explain a second email to the investor.
 */
export function CodeManager({ initial }: { initial: CodeRow[] }) {
  const router = useRouter();
  const [minted, setMinted] = useState<{ code: string; expiresAt: string } | null>(null);
  const [open, setOpen] = useState(initial.length === 0);

  const create = useMutation({
    mutationFn: async (form: FormData) => {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          label: String(form.get("label") ?? ""),
          notes: String(form.get("notes") ?? ""),
          email: String(form.get("email") ?? ""),
          maxUses: Number(form.get("maxUses") ?? 1),
          expiresInDays: Number(form.get("expiresInDays") ?? 30),
        }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        code?: string;
        expiresAt?: string;
        error?: string;
      };
      if (!body.ok || !body.code) throw new Error(body.error ?? "Could not create the code.");
      return { code: body.code, expiresAt: body.expiresAt! };
    },
    onSuccess: (result) => {
      setMinted(result);
      setOpen(false);
      router.refresh();
    },
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/codes?id=${id}`, { method: "DELETE" });
      const body = (await res.json()) as { ok: boolean; sessionsRevoked?: number };
      if (!body.ok) throw new Error("Could not revoke.");
      return body;
    },
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="flex flex-col gap-6">
      {/* ── the one-time reveal ─────────────────────────────────────────── */}
      {minted && (
        <Card className="border-ok/40 bg-ok-wash p-5">
          <StatusBadge status="ok">Copy this now</StatusBadge>
          <p className="mt-3 text-sm text-ink">
            This code will not be shown again. Only its hash is stored.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <code className="select-all border border-line bg-canvas px-3 py-2 font-mono text-base tracking-[0.1em] text-ink">
              {minted.code}
            </code>
            <CopyButton value={minted.code} />
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            Expires {new Date(minted.expiresAt).toLocaleString()}.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => setMinted(null)}
          >
            I have copied it
          </Button>
        </Card>
      )}

      {/* ── create ──────────────────────────────────────────────────────── */}
      <Card>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-h4">Issue a new code</span>
          <span className="text-sm text-ink-subtle">{open ? "Close" : "Open"}</span>
        </button>

        <Collapse open={open}>
          <form
            className="grid gap-5 border-t border-line p-5 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate(new FormData(e.currentTarget));
            }}
          >
            <Field label="Label" htmlFor="label" hint="For your list. The investor never sees it.">
              <Input id="label" name="label" placeholder="Sequoia — intro call" />
            </Field>

            <Field
              label="Bind to email"
              htmlFor="email"
              hint="Optional. If set, redemption requires this address."
            >
              <Input id="email" name="email" type="email" placeholder="partner@fund.com" />
            </Field>

            <Field label="Uses" htmlFor="maxUses" hint="How many times it can be redeemed.">
              <Select id="maxUses" name="maxUses" defaultValue="1">
                <option value="1">1 — single use</option>
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="10">10</option>
              </Select>
            </Field>

            <Field label="Expires in" htmlFor="expiresInDays">
              <Select id="expiresInDays" name="expiresInDays" defaultValue="30">
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </Select>
            </Field>

            <Field
              label="Notes"
              htmlFor="notes"
              className="sm:col-span-2"
              hint="Context for you. Not shown to the investor."
            >
              <Input id="notes" name="notes" placeholder="Warm intro via …" />
            </Field>

            {create.isError && (
              <p role="alert" className="text-sm text-fail sm:col-span-2">
                {create.error.message}
              </p>
            )}

            <div className="sm:col-span-2">
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Creating…" : "Create code"}
              </Button>
            </div>
          </form>
        </Collapse>
      </Card>

      {/* ── the list ────────────────────────────────────────────────────── */}
      {initial.length === 0 ? (
        <p className="border border-line bg-canvas p-5 text-sm text-ink-muted">
          No codes yet.
        </p>
      ) : (
        <div data-scroll className="overflow-x-auto border border-line bg-canvas">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b border-line-strong text-left">
                {["Code", "Label", "Bound to", "Uses", "Expires", "State", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-label uppercase text-ink-subtle"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {initial.map((row) => {
                const state = codeState(row);
                return (
                  <tr key={row.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-mono text-ink">
                      COOL-INV-{row.code_hint}-••••
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{row.label || "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">{row.email ?? "anyone"}</td>
                    <td className="px-4 py-3 text-ink-muted" data-numeric>
                      {row.used_count}/{row.max_uses}
                    </td>
                    <td className="px-4 py-3 text-ink-muted" data-numeric>
                      {new Date(row.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={state.tone}>{state.label}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {state.label === "active" && (
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={revoke.isPending}
                          onClick={() => {
                            if (
                              confirm(
                                "Revoke this code? Any live session it created is signed out immediately.",
                              )
                            ) {
                              revoke.mutate(row.id);
                            }
                          }}
                        >
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Derived, never stored — a stored status drifts the moment a clock passes. */
function codeState(row: CodeRow): { label: string; tone: Status } {
  if (row.revoked_at) return { label: "revoked", tone: "fail" };
  if (new Date(row.expires_at) <= new Date()) return { label: "expired", tone: "neutral" };
  if (row.used_count >= row.max_uses) return { label: "used up", tone: "neutral" };
  return { label: "active", tone: "ok" };
}
