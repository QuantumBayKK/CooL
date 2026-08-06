"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function AdminLoginForm({ className }: { className?: string }) {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");

  const login = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });
      const body = (await res.json()) as { ok: boolean; error?: string };
      if (!body.ok) throw new Error(body.error ?? "Incorrect passphrase.");
      return body;
    },
    onSuccess: () => {
      router.push("/admin");
      router.refresh();
    },
  });

  return (
    <form
      className={cn("flex flex-col gap-5", className)}
      onSubmit={(e) => {
        e.preventDefault();
        login.mutate();
      }}
    >
      <Field label="Passphrase" htmlFor="passphrase">
        <Input
          id="passphrase"
          type="password"
          // `current-password` rather than `off`: password managers ignore
          // `off` anyway, and telling them what this is means it gets stored
          // properly rather than being typed from a note.
          autoComplete="current-password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          required
        />
      </Field>

      {login.isError && (
        <p
          role="alert"
          className="border border-fail/30 bg-fail-wash px-3 py-2.5 text-sm text-fail"
        >
          {login.error.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={login.isPending || !passphrase}>
        {login.isPending ? "Checking…" : "Sign in"}
      </Button>
    </form>
  );
}
