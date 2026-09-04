import { requireAdminRequest } from "@/lib/auth";
import { listFeedItems } from "@/lib/feed-repository";
import type { FeedItemStatus } from "@/types/editorial";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = request.nextUrl;
    const feedItems = await listFeedItems({
      status: (searchParams.get("status") as FeedItemStatus | "all" | null) ?? "new",
      source: searchParams.get("source") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });

    return NextResponse.json({ ok: true, count: feedItems.length, feedItems });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to list feed items",
      },
      { status: 500 },
    );
  }
}
