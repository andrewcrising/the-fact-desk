import { requireAdminOrCronRequest } from "@/lib/auth";
import { ingestConfiguredRssFeeds } from "@/lib/feed-repository";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/ingest/rss
 *
 * Protected by Authorization: Bearer ADMIN_API_TOKEN or CRON_SECRET.
 * Fetches configured RSS feeds and writes durable feed_items. It never directly
 * publishes public stories; editors promote feed items into draft stories first.
 */
export async function POST(request: NextRequest) {
  const unauthorized = requireAdminOrCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const summary = await ingestConfiguredRssFeeds();
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to ingest RSS feeds",
      },
      { status: 500 },
    );
  }
}

/**
 * Vercel Cron issues GET requests. Keep POST for manual/admin callers and GET
 * for scheduled jobs; both require the same bearer-token protection.
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
