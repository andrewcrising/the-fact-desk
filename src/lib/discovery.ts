import { fetchRssStories } from "@/lib/ingest/rss";
import { clusterAndBalanceStories } from "@/lib/ingest/cluster-stories";
import { sanitizeStoryForPublic } from "@/lib/ingest/public-story";
import { EVALUATION_FEEDS } from "@/lib/discovery-feeds";
import { getScheduledSnapshot } from "@/lib/scheduled-discovery";
import { createDiscoveryCache } from "@/lib/discovery-cache";
import type { Story } from "@/types/story";

// Bounded cross-publisher discovery. No editorial publication or reviewer
// attestations are created here. Per-isolate cache reduces Worker RSS fanout;
// durable evaluation snapshots are opt-in; direct RSS remains the bounded fallback.
export { EVALUATION_FEEDS } from "@/lib/discovery-feeds";
export async function fetchDiscoveryWithDiagnostics() {
  const feeds: Array<{ url: string; source: string; category: string; count: number; status: string }> = [];
  const seen = new Set<string>();
  const stories: Story[] = [];
  // Three concurrent requests at most, four reports per feed and short deadlines.
  for (let i = 0; i < EVALUATION_FEEDS.length; i += 3) {
    const batch = EVALUATION_FEEDS.slice(i, i + 3);
    const results = await Promise.allSettled(batch.map((feed) =>
      fetchRssStories(feed.url, {
        sourceName: feed.name,
        category: feed.category,
        signal: "Developing",
        limit: 4,
        timeoutMs: 5000,
        strict: true,
      }),
    ));
    for (const [index, result] of results.entries()) {
      const feed = batch[index];
      feeds.push({ url: feed.url, source: feed.name, category: feed.category, count: result.status === "fulfilled" ? result.value.length : 0, status: result.status === "fulfilled" ? (result.value.length ? "ok" : "empty") : "failed" });
      if (result.status !== "fulfilled") continue;
      for (const story of result.value) {
        const raw = story.sourceUrls?.[0];
        if (!raw) continue;
        let canonical: string;
        try {
          const parsed = new URL(raw);
          if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) continue;
          parsed.hash = "";
          canonical = parsed.toString();
        } catch { continue; }
        if (seen.has(canonical)) continue;
        seen.add(canonical);
        stories.push(sanitizeStoryForPublic({
          ...story,
          sourceUrls: [canonical],
          sourceKinds: [/NASA|Federal Reserve|Department of Justice/.test(feed.name) ? "primary" : "publisher"],
          confidence: "Single-source",
          evidenceLevel: "Low",
          signal: "Developing",
          verifiedIndependentOrigins: [null],
        }));
      }
    }
  }
  // Related articles retain individually linked citations; clustering does
  // not upgrade unreviewed publishers to independently verified origins.
  return { stories: clusterAndBalanceStories(stories), feeds };
}


export async function fetchDiscovery(): Promise<Story[]> {
  return (await fetchDiscoveryWithDiagnostics()).stories;
}

const getLocalDiscovery = createDiscoveryCache(fetchDiscovery);
export const getBoundedDiscovery = Object.assign(async () => {
  const snapshot = await getScheduledSnapshot();
  if (snapshot && snapshot.stories.length) return { stories: snapshot.stories, fetchedAt: snapshot.fetchedAt, source: "scheduled" as const };
  return getLocalDiscovery();
}, { invalidate() { getLocalDiscovery.invalidate(); getScheduledSnapshot.invalidate(); } });
