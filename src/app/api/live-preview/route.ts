import {
  getCachedLiveStories,
  getLiveCacheMeta,
  isLiveBetaEnabled,
} from "@/lib/story-repository";
import { ingestEnabledFeeds } from "@/lib/ingest/ingest-feeds";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/live-preview
 * Returns cached live stories. Optional ?fresh=1 triggers live fetch (preview only).
 */
export async function GET(request: NextRequest) {
  const fresh = request.nextUrl.searchParams.get("fresh") === "1";

  try {
    if (fresh) {
      const stories = await ingestEnabledFeeds();
      return NextResponse.json({
        ok: true,
        source: "live fetch",
        count: stories.length,
        generatedAt: new Date().toISOString(),
        stories,
      });
    }

    const stories = getCachedLiveStories();
    const meta = getLiveCacheMeta();

    return NextResponse.json({
      ok: true,
      source: "cache",
      count: stories.length,
      generatedAt: meta.generatedAt,
      feedCount: meta.feedCount,
      liveBetaEnabled: isLiveBetaEnabled(),
      stories,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message, count: 0, stories: [] },
      { status: 500 },
    );
  }
}
