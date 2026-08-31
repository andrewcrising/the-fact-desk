/**
 * Production live RSS layer — assemble from source-level Next.js fetch caches
 * with a file fallback. Keeping a single cache layer avoids compounding a
 * five-minute feed cache with an additional stale whole-desk cache.
 */
import { ingestEnabledFeeds } from "@/lib/ingest/ingest-feeds";
import { sanitizeStoryForPublic } from "@/lib/ingest/public-story";
import { readLiveStoriesCache } from "@/lib/live-stories-cache";
import type { Story } from "@/types/story";

export type LiveDataSource = "live" | "cache";

export interface LiveFeedResult {
  stories: Story[];
  source: LiveDataSource;
  fetchedAt: string | null;
}

/** Live RSS for homepage/API. Never throws. */
export async function getLiveFeed(): Promise<LiveFeedResult> {
  try {
    const stories = (await ingestEnabledFeeds()).map(sanitizeStoryForPublic);
    if (stories.length > 0) {
      return {
        stories,
        source: "live",
        fetchedAt: new Date().toISOString(),
      };
    }
  } catch {
    // fall through to file cache
  }

  const cache = readLiveStoriesCache();
  return {
    stories: cache.stories.map(sanitizeStoryForPublic),
    source: "cache",
    fetchedAt: cache.generatedAt,
  };
}
