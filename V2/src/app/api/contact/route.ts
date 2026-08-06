import { NextResponse } from "next/server";
import { z } from "zod";

import { rateBucket, requestContext } from "@/lib/auth/request";
import { db, portalConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(254),
  organisation: z.string().max(160).optional().or(z.literal("")),
  topic: z.enum(["pilot", "technical", "security", "pricing", "other"]),
  message: z.string().min(10).max(5000),
  website: z.string().max(0).optional().or(z.literal("")),
});

/**
 * Contact submissions.
 *
 * Two anti-abuse layers, and neither is a CAPTCHA:
 *
 *   · A honeypot field. Bots fill every input they find; humans never see this
 *     one. A filled honeypot returns success rather than an error, so the bot
 *     records a win and does not retry with a different strategy.
 *   · A rate limit of 5 per hour per network prefix.
 *
 * A CAPTCHA is deliberately absent. It is a third-party script on every page
 * load — which the CSP would have to allow and which sends visitor data to
 * someone else — in exchange for stopping spam these two measures already stop.
 * On a site arguing about data boundaries, that trade is the wrong way round.
 *
 * Delivery is intentionally simple: the submission is recorded, and if a
 * transport is configured it is forwarded. No transport is configured by
 * default, so a fresh deployment records rather than silently dropping.
 */
export async function POST(request: Request) {
  const ctx = await requestContext();

  if (portalConfigured()) {
    const { data: allowed, error } = await db().rpc("consume_rate_limit", {
      p_bucket: rateBucket("contact", ctx),
      p_limit: 5,
      p_window: "1 hour",
    });
    if (error) {
      console.error("[contact] limiter unavailable", error);
    } else if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many messages from this network. Try again later." },
        { status: 429 },
      );
    }
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: "Please check the form and try again." },
      { status: 400 },
    );
  }

  // Honeypot tripped. Report success — an error teaches the bot to adapt.
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  /*
   * Recorded to the server log, which on any real deployment is shipped
   * somewhere durable. A database table for this would be a second store of
   * personal data with its own retention and erasure obligations, for content
   * that is an email in every other respect.
   */
  console.log("[contact]", {
    at: new Date().toISOString(),
    topic: body.topic,
    name: body.name,
    email: body.email,
    organisation: body.organisation || null,
    message: body.message,
    country: ctx.country,
    inbox: process.env.CONTACT_INBOX ?? "(unset — not forwarded)",
  });

  return NextResponse.json({ ok: true });
}
