import { Dashboard } from "@/components/layout/Dashboard";
import { Hero } from "@/components/layout/Hero";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopNav } from "@/components/layout/TopNav";
import { rankHomepageStories } from "@/lib/homepage-ranking";
import {
  getHomepageStories,
  getLivePreviewStories,
  isLiveBetaEnabled,
} from "@/lib/story-repository";

// Reviewed publication is an editorial state transition, not a cache-refresh
// suggestion. Keep the durable homepage request-driven so a deliberately
// published/corrected/archived story is reflected on the next page load.
export const dynamic = "force-dynamic";

export default async function Home() {
  const stories = rankHomepageStories(await getHomepageStories());
  const showLiveBeta = isLiveBetaEnabled();
  const liveFeed = showLiveBeta
    ? await getLivePreviewStories()
    : { stories: [], source: "cache" as const, fetchedAt: null };

  return (
    <>
      <TopNav />
      <Hero />
      <Dashboard
        stories={stories}
        livePreviewStories={liveFeed.stories}
        liveFeedSource={liveFeed.source}
        liveFeedFetchedAt={liveFeed.fetchedAt}
        showLiveBeta={showLiveBeta}
      />
      <SiteFooter showLiveBeta={showLiveBeta} />
    </>
  );
}
