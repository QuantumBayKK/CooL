"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/**
 * Invite-code redemption form.
 *
 * The `code` pattern is validated client-side purely as a typing aid — it
 * catches a transposed character before a network round trip and before the
 * rate limiter counts an attempt against the user. It is not a security
 * control; the server re-normalises and re-validates everything, and this file
 * ships to the browser where anyone can edit it.
 */

const Schema = z.object({
  code: z
    .string()
    .min(1, "Enter the code from your invitation.")
    // Accept any spacing/casing; the server normalises. We only insist there
    // are eight code characters present somewhere.
    .refine(
      (v) => (v.toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/^COOLINV/, "")).length === 8,
      "That does not look like a complete code. It ends with eight characters.",
    ),
  email: z
    .string()
    .email("Enter a valid email address.")
    .optional()
    .or(z.literal("")),
});

type Values = z.infer<typeof Schema>;

export function RedeemForm({
  next,
  className,
}: {
  next?: string;
  className?: string;
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { code: "", email: "" },
  });

  const redeem = useMutation({
    mutationFn: async (values: Values) => {
      const res = await fetch("/api/investor/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: string;
        redirect?: string;
      };
      if (!body.ok) throw new Error(body.error ?? "That code is not valid.");
      return body;
    },
    onSuccess: (body) => {
      /*
       * Only ever navigate to a same-origin path.
       *
       * `next` arrives from the query string, which anyone can set. Passing it
       * to `router.push` unchecked is an open-redirect: a link to
       * /investor/login?next=https://evil.example lands the investor on an
       * attacker's page wearing our domain in the referrer.
       *
       * The `//` check matters as much as the leading `/` — `//evil.example`
       * is a protocol-relative URL and is absolutely a different origin.
       */
      const safe =
        next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.push(safe ?? body.redirect ?? "/investor/overview");
      // The portal is server-rendered behind a session check; without this the
      // client cache can serve the pre-login shell for a beat.
      router.refresh();
    },
  });

  return (
    <form
      className={cn("flex flex-col gap-5", className)}
      onSubmit={handleSubmit((v) => redeem.mutate(v))}
      noValidate
    >
      <Field
        label="Invite code"
        htmlFor="code"
        error={errors.code?.message}
        hint="Looks like COOL-INV-72JQ-A91K"
      >
        <Input
          id="code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="COOL-INV-••••-••••"
          className="font-mono tracking-[0.08em]"
          aria-invalid={Boolean(errors.code)}
          {...register("code")}
        />
      </Field>

      <Field
        label="Email"
        htmlFor="email"
        error={errors.email?.message}
        hint="Only required if your code was issued to a specific address."
      >
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@fund.com"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
      </Field>

      {redeem.isError && (
        // `assertive` rather than `polite`: this replaces the reason the user
        // cannot proceed, and a screen-reader user should not have to go
        // looking for it after the focus has moved on.
        <p
          role="alert"
          aria-live="assertive"
          className="border border-fail/30 bg-fail-wash px-3 py-2.5 text-sm text-fail"
        >
          {redeem.error.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={redeem.isPending}>
        {redeem.isPending ? "Checking…" : "Enter"}
      </Button>
    </form>
  );
}
