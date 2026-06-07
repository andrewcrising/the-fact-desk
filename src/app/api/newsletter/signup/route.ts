import { checkRateLimit } from "@/lib/rate-limit";
import { DatabaseUnavailableError } from "@/lib/supabase";
import { upsertSubscriber } from "@/lib/subscriber-repository";
import { asString, isEmail, isRecord } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json(
        { ok: false, error: "Request body must be an object" },
        { status: 400 },
      );
    }

    if (asString(body.company)) {
      return NextResponse.json({ ok: true }, { status: 202 });
    }

    const email = asString(body.email);
    if (!email || !isEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "A valid email is required" },
        { status: 400 },
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (!checkRateLimit(`newsletter:${ip}`, { limit: 5, windowMs: 60_000 })) {
      return NextResponse.json(
        { ok: false, error: "Too many signup attempts. Try again shortly." },
        { status: 429 },
      );
    }

    await upsertSubscriber(email);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Newsletter signup is unavailable until Supabase is configured.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to subscribe",
      },
      { status: 500 },
    );
  }
}
