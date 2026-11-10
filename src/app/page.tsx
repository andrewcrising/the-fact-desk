import { Dashboard } from "@/components/layout/Dashboard";
import { Hero } from "@/components/layout/Hero";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopNav } from "@/components/layout/TopNav";
import { rankHomepageStories } from "@/lib/homepage-ranking";
import { getHomepageStories } from "@/lib/story-repository";
import { fetchRssStories } from "@/lib/ingest/rss";
import { clusterAndBalanceStories } from "@/lib/ingest/cluster-stories";
import { sanitizeStoryForPublic } from "@/lib/ingest/public-story";
import type { Story } from "@/types/story";

// Isolated evaluation branch: do not merge request-time discovery into production.
export const dynamic = "force-dynamic";

// Bounded cross-publisher discovery. No editorial publication or reviewer
// attestations are created here. Per-isolate cache reduces Worker RSS fanout;
// a durable scheduler/cache is still required for multi-isolate reliability.
const EVALUATION_FEEDS = [
  { url: "https://feeds.npr.org/1001/rss.xml", name: "NPR", category: "World" },
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", name: "BBC World", category: "World" },
  { url: "https://www.theguardian.com/world/rss", name: "The Guardian", category: "World" },
  { url: "https://www.pbs.org/newshour/feeds/rss/politics", name: "PBS News", category: "Politics" },
  { url: "https://moxie.foxnews.com/google-publisher/politics.xml", name: "Fox News", category: "Politics" },
  { url: "https://www.nasa.gov/news-release/feed/", name: "NASA", category: "Technology" },
  { url: "https://www.federalreserve.gov/feeds/press_all.xml", name: "Federal Reserve", category: "Markets" },
  { url: "https://www.justice.gov/news/rss", name: "U.S. Department of Justice", category: "Courts" },
  { url: "https://feeds.bbci.co.uk/news/health/rss.xml", name: "BBC Health", category: "Health" },
  { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", name: "BBC Science", category: "Energy" },
  { url: "https://www.theguardian.com/culture/rss", name: "The Guardian", category: "Culture" },
] as const;
const DISCOVERY_TTL_MS = 5 * 60 * 1000;
let discoveryCache: { stories: Story[]; fetchedAt: string; expiresAt: number } | null = null;
let pendingDiscovery: Promise<Story[]> | null = null;

async function fetchDiscovery(): Promise<Story[]> {
  const seen = new Set<string>();
  const stories: Story[] = [];
  // Three concurrent requests at most, two reports per feed and short deadlines.
  for (let i = 0; i < EVALUATION_FEEDS.length; i += 3) {
    const batch = EVALUATION_FEEDS.slice(i, i + 3);
    const results = await Promise.allSettled(batch.map((feed) =>
      fetchRssStories(feed.url, {
        sourceName: feed.name,
        category: feed.category,
        signal: "Developing",
        limit: 2,
        timeoutMs: 2300,
        strict: true,
      }),
    ));
    for (const result of results) {
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
  return clusterAndBalanceStories(stories);
}

async function getBoundedDiscovery(): Promise<Story[]> {
  if (discoveryCache && Date.now() < discoveryCache.expiresAt) return discoveryCache.stories;
  if (!pendingDiscovery) {
    pendingDiscovery = fetchDiscovery().then((stories) => {
      if (stories.length) discoveryCache = {
        stories, fetchedAt: new Date().toISOString(), expiresAt: Date.now() + DISCOVERY_TTL_MS,
      };
      return stories.length ? stories : discoveryCache?.stories ?? [];
    }).catch(() => discoveryCache?.stories ?? []).finally(() => { pendingDiscovery = null; });
  }
  return pendingDiscovery;
}

export default async function Home() {
  const [published, discovery] = await Promise.all([
    getHomepageStories().catch(() => []),
    getBoundedDiscovery().catch(() => [] as Story[]),
  ]);
  const stories = rankHomepageStories(published);
  return (
    <>
      <TopNav />
      <Hero />
      <Dashboard
        stories={stories}
        livePreviewStories={discovery}
        liveFeedSource="live"
        liveFeedFetchedAt={discoveryCache?.fetchedAt ?? null}
        showLiveBeta={true}
      />
      {discovery.length === 0 && (
        <section aria-label="Live discovery status" className="mx-auto max-w-5xl px-6 py-4 text-sm">
          Live RSS discovery is temporarily unavailable. No unreviewed report has
          been promoted to verified or published status.
        </section>
      )}
      <SiteFooter showLiveBeta={true} />
    </>
  );
}
