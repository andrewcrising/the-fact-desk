/**
 * Production live layer — publisher RSS plus opt-in social discovery, with a
 * file fallback for publisher coverage. Social failures never take down RSS.
 */
import { ingestEnabledFeeds } from "@/lib/ingest/ingest-feeds";
import { sanitizeStoryForPublic } from "@/lib/ingest/public-story";
import { ingestSocialSignalStories } from "@/lib/ingest/social-signal";
import { readLiveStoriesCache } from "@/lib/live-stories-cache";
import type { Story } from "@/types/story";

export type LiveDataSource = "live" | "cache";

export interface LiveFeedResult {
  stories: Story[];
  source: LiveDataSource;
  fetchedAt: string | null;
}

async function safeSocialStories(): Promise<Story[]> {
  try {
    return await ingestSocialSignalStories();
  } catch {
    return [];
  }
}

/** Publisher reporting plus non-legacy discovery signals. Never throws. */
export async function getLiveFeed(): Promise<LiveFeedResult> {
  const [publisherStories, socialStories] = await Promise.all([
    ingestEnabledFeeds().catch(() => [] as Story[]),
    safeSocialStories(),
  ]);

  if (publisherStories.length > 0) {
    return {
      stories: [...publisherStories, ...socialStories].map(sanitizeStoryForPublic),
      source: "live",
      fetchedAt: new Date().toISOString(),
    };
  }

  const cache = readLiveStoriesCache();
  return {
    stories: [...cache.stories, ...socialStories].map(sanitizeStoryForPublic),
    source: "cache",
    fetchedAt: cache.generatedAt,
  };
}
