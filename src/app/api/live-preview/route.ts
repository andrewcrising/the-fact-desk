import { getLiveFeed } from "@/lib/live-data";
import { isLiveBetaEnabled } from "@/lib/story-repository";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/live-preview — returns current live feed (cached fetch + file fallback). */
export async function GET(request: NextRequest) {
  const fresh = request.nextUrl.searchParams.get("fresh") === "1";

  try {
    if (fresh) {
      const { ingestEnabledFeeds } = await import("@/lib/ingest/ingest-feeds");
      const stories = await ingestEnabledFeeds();
      return NextResponse.json({
        ok: true,
        source: "live fetch",
        count: stories.length,
        generatedAt: new Date().toISOString(),
        stories,
      });
    }

    const result = await getLiveFeed();

    return NextResponse.json({
      ok: true,
      source: result.source,
      count: result.stories.length,
      generatedAt: result.fetchedAt,
      liveBetaEnabled: isLiveBetaEnabled(),
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
