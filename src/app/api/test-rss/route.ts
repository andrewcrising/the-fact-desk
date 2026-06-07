import { requireAdminOrCronRequest } from "@/lib/auth";
import {
  DEFAULT_TEST_RSS_FEED,
  DEFAULT_TEST_RSS_OPTIONS,
  fetchRssStories,
} from "@/lib/ingest/rss";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Proof-of-concept: GET /api/test-rss
 * Returns normalized Story-shaped JSON from one live RSS feed.
 * Does not affect the homepage mock desk.
 */
export async function GET(request: NextRequest) {
  const unauthorized = requireAdminOrCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const stories = await fetchRssStories(
      DEFAULT_TEST_RSS_FEED,
      DEFAULT_TEST_RSS_OPTIONS,
    );

    return NextResponse.json({
      ok: true,
      feedUrl: DEFAULT_TEST_RSS_FEED,
      count: stories.length,
      stories,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown RSS ingestion error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
