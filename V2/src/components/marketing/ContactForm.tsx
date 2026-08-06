"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Card, StatusBadge } from "@/components/ui/primitives";

const TOPICS = [
  { value: "pilot", label: "A pilot or design partnership" },
  { value: "technical", label: "A technical question" },
  { value: "security", label: "A security or vulnerability report" },
  { value: "pricing", label: "Pricing and planning" },
  { value: "other", label: "Something else" },
] as const;

const Schema = z.object({
  name: z.string().min(1, "Tell us who you are.").max(120),
  email: z.string().email("Enter a valid email address.").max(254),
  organisation: z.string().max(160).optional().or(z.literal("")),
  topic: z.enum(["pilot", "technical", "security", "pricing", "other"]),
  message: z
    .string()
    .min(10, "A sentence or two, so we can give you a useful answer.")
    .max(5000),
  // Honeypot. Real users never see this field and never fill it.
  website: z.string().max(0).optional().or(z.literal("")),
});

type Values = z.infer<typeof Schema>;

/**
 * `useSearchParams` needs a Suspense boundary in the App Router, or the whole
 * route opts out of static rendering. The form is wrapped rather than the page
 * so the rest of /contact still prerenders.
 */
export function ContactForm() {
  return (
    <Suspense fallback={<div className="h-[32rem]" />}>
      <ContactFormInner />
    </Suspense>
  );
}

function ContactFormInner() {
  const params = useSearchParams();
  const topicParam = params.get("topic");
  const initialTopic = TOPICS.some((t) => t.value === topicParam)
    ? (topicParam as Values["topic"])
    : "pilot";

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { topic: initialTopic, name: "", email: "", message: "", website: "" },
  });

  const send = useMutation({
    mutationFn: async (values: Values) => {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await res.json()) as { ok: boolean; error?: string };
      if (!body.ok) throw new Error(body.error ?? "That did not send.");
      return body;
    },
    onSuccess: () => reset(),
  });

  if (send.isSuccess) {
    return (
      <Card className="p-7">
        <StatusBadge status="ok">Sent</StatusBadge>
        <h2 className="mt-4 text-h3">Thank you — we have it.</h2>
        <p className="mt-3 text-sm text-ink-muted">
          A person reads these, not a queue. Expect a reply within two working
          days; if your message was a security report, sooner.
        </p>
        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => send.reset()}
        >
          Send another
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-7">
      <h2 className="text-h3">Send a message</h2>

      <form
        className="mt-6 flex flex-col gap-5"
        onSubmit={handleSubmit((v) => send.mutate(v))}
        noValidate
      >
        <Field label="Name" htmlFor="name" error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>

        <Field
          label="Organisation"
          htmlFor="organisation"
          hint="Optional."
          error={errors.organisation?.message}
        >
          <Input id="organisation" autoComplete="organization" {...register("organisation")} />
        </Field>

        <Field label="Topic" htmlFor="topic" error={errors.topic?.message}>
          <Select id="topic" {...register("topic")}>
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Message" htmlFor="message" error={errors.message?.message}>
          <Textarea
            id="message"
            rows={6}
            aria-invalid={Boolean(errors.message)}
            {...register("message")}
          />
        </Field>

        {/* Honeypot: hidden from sight AND from assistive technology, so a
            screen-reader user is never asked to fill a trap. `tabIndex={-1}`
            keeps it out of the keyboard order too. */}
        <div aria-hidden className="hidden">
          <label htmlFor="website">Website</label>
          <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>

        {send.isError && (
          <p
            role="alert"
            className="border border-fail/30 bg-fail-wash px-3 py-2.5 text-sm text-fail"
          >
            {send.error.message}
          </p>
        )}

        <Button type="submit" size="lg" disabled={send.isPending}>
          {send.isPending ? "Sending…" : "Send"}
        </Button>

        <p className="text-xs text-ink-subtle">
          We use this to reply to you and nothing else. No newsletter, no
          tracking pixel, no CRM enrichment.
        </p>
      </form>
    </Card>
  );
}
