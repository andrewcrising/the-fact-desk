import { requireAdminRequest } from "@/lib/auth";
import { promoteFeedItemToDraft } from "@/lib/feed-repository";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const story = await promoteFeedItemToDraft(id);
    return NextResponse.json({ ok: true, story }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to promote feed item",
      },
      { status: 400 },
    );
  }
}
