import { isCurrentFeedTimestamp } from "@/lib/ingest/feed-time";
import type { Story } from "@/types/story";

export const DISCOVERY_TTL_MS = 5 * 60 * 1000;
export const MAX_FALLBACK_AGE_MS = 30 * 60 * 1000;
const FAILURE_RETRY_MS = 30 * 1000;
export interface DiscoveryResult {
  stories: Story[];
  source: "live" | "cache";
  fetchedAt: string | null;
}

export function freshCacheStories(stories: Story[], fetchedAt: string | null, now = Date.now()): Story[] {
  const timestamp = Date.parse(fetchedAt ?? "");
  if (!Number.isFinite(timestamp) || timestamp > now || now - timestamp > MAX_FALLBACK_AGE_MS) return [];
  return stories.filter((story) => isCurrentFeedTimestamp(story.publishedAt, now));
}

/** Single-flight refresh, bounded stale fallback and backoff during upstream outages. */
export function createDiscoveryCache(fetchStories: () => Promise<Story[]>, now = Date.now) {
  let cache: DiscoveryResult = { stories: [], source: "cache", fetchedAt: null };
  let retryAt = 0;
  let pending: Promise<DiscoveryResult> | null = null;
  let generation = 0;
  async function getDiscovery(): Promise<DiscoveryResult> {
    const timestamp = now();
    const retained = freshCacheStories(cache.stories, cache.fetchedAt, timestamp);
    if (timestamp < retryAt) return { ...cache, stories: retained, fetchedAt: retained.length ? cache.fetchedAt : null };
    if (!pending) {
      const startedGeneration = generation;
      const current = fetchStories().then((stories) => {
        if (startedGeneration !== generation) return snapshot();
        const finishedAt = now();
        const eligible = stories.filter((story) => isCurrentFeedTimestamp(story.publishedAt, finishedAt));
        if (eligible.length) {
          cache = { stories: eligible, fetchedAt: new Date(finishedAt).toISOString(), source: "live" };
          retryAt = finishedAt + DISCOVERY_TTL_MS;
        } else {
          cache = { ...cache, source: "cache" };
          retryAt = finishedAt + FAILURE_RETRY_MS;
        }
        const retained = freshCacheStories(cache.stories, cache.fetchedAt, finishedAt);
        return { ...cache, stories: retained, fetchedAt: retained.length ? cache.fetchedAt : null };
      }).catch(() => {
        if (startedGeneration !== generation) return snapshot();
        cache = { ...cache, source: "cache" };
        retryAt = now() + FAILURE_RETRY_MS;
        const stories = freshCacheStories(cache.stories, cache.fetchedAt, now());
        return { ...cache, stories, fetchedAt: stories.length ? cache.fetchedAt : null };
      }).finally(() => { if (pending === current) pending = null; });
      pending = current;
    }
    return pending;
  }
  function snapshot(): DiscoveryResult {
    const stories = freshCacheStories(cache.stories, cache.fetchedAt, now());
    return { ...cache, stories, fetchedAt: stories.length ? cache.fetchedAt : null };
  }
  return Object.assign(getDiscovery, {
    invalidate() { generation++; retryAt = 0; pending = null; cache = { ...cache, source: "cache" }; },
  });
}
