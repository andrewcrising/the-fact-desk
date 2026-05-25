/**
 * Multi-feed RSS ingestion. One bad feed must not break the batch.
 * Later: invoked from Vercel Cron, writes to persistent storage.
 */
import { getEnabledFeeds } from "@/data/rssFeeds";
import { fetchRssStories } from "@/lib/ingest/rss";
import type { Story } from "@/types/story";

const PER_FEED_LIMIT = 5;

function dedupeKey(story: Story): string {
  const link = story.sourceUrls?.[0];
  if (link) return link.toLowerCase();
  return story.title.toLowerCase().trim();
}

/**
 * Fetch all enabled feeds, normalize, dedupe, sort newest first.
 */
export async function ingestEnabledFeeds(): Promise<Story[]> {
  const feeds = getEnabledFeeds();
  const combined: Story[] = [];
  const seen = new Set<string>();

  for (const feed of feeds) {
    try {
      const items = await fetchRssStories(feed.feedUrl, {
        sourceName: feed.sourceName,
        category: feed.category,
        signal: feed.signal,
        limit: PER_FEED_LIMIT,
      });

      for (const item of items) {
        const key = dedupeKey(item);
        if (seen.has(key)) continue;
        seen.add(key);
        combined.push(item);
      }
    } catch {
      // Skip failed feed
    }
  }

  return combined.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}
