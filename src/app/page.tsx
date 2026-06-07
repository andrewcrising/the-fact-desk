import { Dashboard } from "@/components/layout/Dashboard";
import { Hero } from "@/components/layout/Hero";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopNav } from "@/components/layout/TopNav";
import {
  getHomepageStories,
  getLivePreviewStories,
  isLiveBetaEnabled,
} from "@/lib/story-repository";

export const revalidate = 900;

export default async function Home() {
  const stories = await getHomepageStories();
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
