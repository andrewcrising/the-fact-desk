import { Dashboard } from "@/components/layout/Dashboard";
import { Hero } from "@/components/layout/Hero";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopNav } from "@/components/layout/TopNav";
import {
  getLivePreviewStories,
  isLiveBetaEnabled,
} from "@/lib/story-repository";

/**
 * Render the shell per request so the homepage cannot accumulate an additional
 * ISR layer on top of the five-minute source fetch caches.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  const showLiveBeta = isLiveBetaEnabled();
  const liveFeed = showLiveBeta
    ? await getLivePreviewStories()
    : { stories: [], source: "cache" as const, fetchedAt: null };

  return (
    <>
      <TopNav />
      <Hero />
      <Dashboard
        stories={[]}
        livePreviewStories={liveFeed.stories}
        liveFeedSource={liveFeed.source}
        liveFeedFetchedAt={liveFeed.fetchedAt}
        showLiveBeta={showLiveBeta}
      />
      <SiteFooter showLiveBeta={showLiveBeta && liveFeed.stories.length > 0} />
    </>
  );
}
