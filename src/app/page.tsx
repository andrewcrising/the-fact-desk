import { Dashboard } from "@/components/layout/Dashboard";
import { Hero } from "@/components/layout/Hero";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopNav } from "@/components/layout/TopNav";
import { rankHomepageStories } from "@/lib/homepage-ranking";
import { getHomepageStories } from "@/lib/story-repository";
import { fetchRssStories } from "@/lib/ingest/rss";
import { sanitizeStoryForPublic } from "@/lib/ingest/public-story";
import type { Story } from "@/types/story";

// Isolated evaluation branch: do not merge request-time discovery into production.
export const dynamic = "force-dynamic";

// Small, independent publisher/primary-source sample. Never grant editorial
// verification based on the number of fetched sources or repeated headlines.
const EVALUATION_FEEDS = [
  { url: "https://feeds.npr.org/1001/rss.xml", name: "NPR", category: "World" },
  { url: "https://www.justice.gov/news/rss", name: "U.S. Department of Justice", category: "Courts" },
] as const;

async function getBoundedDiscovery(): Promise<Story[]> {
  const results = await Promise.allSettled(EVALUATION_FEEDS.map(async (feed) =>
    fetchRssStories(feed.url, {
      sourceName: feed.name,
      category: feed.category,
      signal: "Developing",
      limit: 3,
      timeoutMs: 2200,
    }),
  ));
  const seen = new Set<string>();
  const stories: Story[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const story of result.value) {
      const url = story.sourceUrls?.[0];
      if (!url) continue;
      let canonical: string;
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) continue;
        parsed.hash = "";
        canonical = parsed.toString();
      } catch { continue; }
      if (seen.has(canonical)) continue;
      seen.add(canonical);
      // RSS is discovery, not publication, corroboration, or independent review.
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
  return stories;
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
        liveFeedFetchedAt={discovery.length ? new Date().toISOString() : null}
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
