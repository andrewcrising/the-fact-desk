import { requireAdminRequest } from "@/lib/auth";
import { promoteStory } from "@/lib/story-repository";
import { asBoolean, asNumber, isRecord } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => ({}));
    const options = isRecord(body)
      ? {
          homepageRank: asNumber(body.homepageRank),
          isLead: asBoolean(body.isLead),
        }
      : {};
    const { id } = await params;
    const story = await promoteStory(id, options);
    return NextResponse.json({ ok: true, story });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to promote story",
      },
      { status: 400 },
    );
  }
}
