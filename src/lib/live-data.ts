/**
 * Production live RSS layer — fetch with Next.js cache, file fallback.
 * Vercel Cron revalidates via /api/cron/revalidate-live (tag: live-rss).
 * Later: persist ingest results in Supabase/KV/Blob instead of unstable_cache only.
 */
import { ingestEnabledFeeds } from "@/lib/ingest/ingest-feeds";
import { readLiveStoriesCache } from "@/lib/live-stories-cache";
import type { Story } from "@/types/story";
import { unstable_cache } from "next/cache";

export type LiveDataSource = "live" | "cache";

export interface LiveFeedResult {
  stories: Story[];
  source: LiveDataSource;
  fetchedAt: string | null;
}

const REVALIDATE_SECONDS = 900;

const fetchLiveRss = unstable_cache(
  async (): Promise<LiveFeedResult> => ({
    stories: await ingestEnabledFeeds(),
    source: "live",
    fetchedAt: new Date().toISOString(),
  }),
  ["live-rss-feed"],
  { revalidate: REVALIDATE_SECONDS, tags: ["live-rss"] },
);

/** Live RSS for homepage/API. Never throws. */
export async function getLiveFeed(): Promise<LiveFeedResult> {
  try {
    const liveFeed = await fetchLiveRss();
    if (liveFeed.stories.length > 0) {
      return liveFeed;
    }
  } catch {
    // fall through to file cache
  }

  const cache = readLiveStoriesCache();
  return {
    stories: cache.stories,
    source: "cache",
    fetchedAt: cache.generatedAt,
  };
}
