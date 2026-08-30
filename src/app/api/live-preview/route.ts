import { getLiveFeed } from "@/lib/live-data";
import { ingestEnabledFeedsWithDiagnostics } from "@/lib/ingest/ingest-feeds";
import { isLiveBetaEnabled } from "@/lib/story-repository";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/live-preview — current cached feed or a diagnostic live fetch. */
export async function GET(request: NextRequest) {
  const fresh = request.nextUrl.searchParams.get("fresh") === "1";

  try {
    if (fresh) {
      const result = await ingestEnabledFeedsWithDiagnostics();
      return NextResponse.json({
        ok: true,
        source: "live fetch",
        count: result.stories.length,
        generatedAt: new Date().toISOString(),
        feedsChecked: result.feedsChecked,
        feedsWithStories: result.feedsWithStories,
        activeSourceCount: result.activeSourceCount,
        activeSources: result.activeSources,
        failedFeedIds: result.failedFeedIds,
        emptyFeedIds: result.emptyFeedIds,
        stories: result.stories,
      });
    }

    const result = await getLiveFeed();
    return NextResponse.json({
      ok: true,
      source: result.source,
      count: result.stories.length,
      generatedAt: result.fetchedAt,
      liveBetaEnabled: isLiveBetaEnabled(),
      activeSourceCount: new Set(
        result.stories.flatMap((story) => story.sources),
      ).size,
      stories: result.stories,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message, count: 0, stories: [] },
      { status: 500 },
    );
  }
}
