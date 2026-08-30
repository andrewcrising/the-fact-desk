/**
 * Story repository — data access boundary for UI and routes.
 *
 * Mock: src/data/stories.ts (default homepage)
 * Live cache: data/live-stories.json (npm run ingest:rss)
 * Legacy cache: data/rss-cache.json (NEXT_PUBLIC_USE_RSS_CACHE)
 *
 * Production later: Vercel Cron → Supabase/Postgres/KV/Blob → read here.
 * Do not rely on serverless filesystem for production ingestion.
 */
import { stories as mockStories } from "@/data/stories";
import { readLiveStoriesCache } from "@/lib/live-stories-cache";
import { readRssCache } from "@/lib/rss-cache";
import { sortByTrending } from "@/lib/stories";
import type { Signal, Story, StoryCategory } from "@/types/story";

export function isRssCacheEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_RSS_CACHE === "true";
}

/**
 * Personal proof mode shows the live feed by default.
 * Set NEXT_PUBLIC_SHOW_LIVE_BETA=false to disable it explicitly.
 */
export function isLiveBetaEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_LIVE_BETA !== "false";
}

export function isMergedStoriesEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_MERGED_STORIES === "true";
}

export function getAllStories(): Story[] {
  return sortByTrending([...mockStories]);
}

/** Cached live RSS from data/live-stories.json (server-only). */
export function getCachedLiveStories(): Story[] {
  if (typeof window !== "undefined") {
    return [];
  }
  return readLiveStoriesCache().stories;
}

/** Legacy dev cache from data/rss-cache.json. */
export function getCachedRssStories(): Story[] {
  if (typeof window !== "undefined" || !isRssCacheEnabled()) {
    return [];
  }
  return readRssCache().stories;
}

/** Mock + cached live stories, deduped by slug (mock wins). */
export function getMergedStories(): Story[] {
  const mock = getAllStories();
  const slugs = new Set(mock.map((s) => s.slug));
  const live = getCachedLiveStories().filter((s) => !slugs.has(s.slug));
  return [...mock, ...live];
}

/** Live Beta section — live RSS fetch with cache + file fallback. */
export async function getLivePreviewStories() {
  if (!isLiveBetaEnabled()) {
    return { stories: [], source: "cache" as const, fetchedAt: null };
  }
  const { getLiveFeed } = await import("@/lib/live-data");
  return getLiveFeed();
}

/** Main homepage mock desk. Merged only when explicitly enabled. */
export function getHomepageStories(): Story[] {
  if (isMergedStoriesEnabled()) {
    return getMergedStories();
  }
  if (isRssCacheEnabled()) {
    const mock = getAllStories();
    const slugs = new Set(mock.map((s) => s.slug));
    const legacy = getCachedRssStories().filter((s) => !slugs.has(s.slug));
    return [...mock, ...legacy];
  }
  return getAllStories();
}

export function getStoryBySlug(slug: string): Story | undefined {
  return mockStories.find((s) => s.slug === slug);
}

export function getStoriesBySignal(signal: Signal): Story[] {
  return getHomepageStories().filter((s) => s.signal === signal);
}

export function getStoriesByCategory(category: StoryCategory): Story[] {
  return getHomepageStories().filter((s) => s.category === category);
}

/** Static generation for mock story detail pages. */
export function getAllSlugs(): string[] {
  return mockStories.map((s) => s.slug);
}

export function getLiveCacheMeta() {
  if (typeof window !== "undefined") {
    return { generatedAt: null, feedCount: 0, storyCount: 0 };
  }
  const cache = readLiveStoriesCache();
  return {
    generatedAt: cache.generatedAt,
    feedCount: cache.feedCount,
    storyCount: cache.stories.length,
  };
}

/** Live fetch proof for /api/test-rss — does not affect homepage. */
export async function getIngestedStoriesPreview() {
  const {
    DEFAULT_TEST_RSS_FEED,
    DEFAULT_TEST_RSS_OPTIONS,
    fetchRssStories,
  } = await import("@/lib/ingest/rss");

  return fetchRssStories(DEFAULT_TEST_RSS_FEED, DEFAULT_TEST_RSS_OPTIONS);
}
