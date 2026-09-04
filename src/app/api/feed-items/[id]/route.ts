import { requireAdminRequest } from "@/lib/auth";
import { updateFeedItemStatus } from "@/lib/feed-repository";
import type { FeedItemStatus } from "@/types/editorial";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const STATUSES: FeedItemStatus[] = ["new", "reviewed", "promoted", "ignored", "error"];

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const status = body?.status as FeedItemStatus | undefined;
    if (!status || !STATUSES.includes(status)) {
      return NextResponse.json(
        { ok: false, error: "Invalid feed item status" },
        { status: 400 },
      );
    }

    const { id } = await params;
    const feedItem = await updateFeedItemStatus(id, status);
    return NextResponse.json({ ok: true, feedItem });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to update feed item",
      },
      { status: 400 },
    );
  }
}
