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

    const email = asString(body.email);
    if (!email || !isEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "A valid email is required" },
        { status: 400 },
      );
    }

    const subscriber = await upsertSubscriber(email);
    return NextResponse.json({ ok: true, subscriber }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to subscribe",
      },
      { status: 500 },
    );
  }
}
