import { Dashboard } from "@/components/layout/Dashboard";
import { Hero } from "@/components/layout/Hero";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopNav } from "@/components/layout/TopNav";
import { rankHomepageStories } from "@/lib/homepage-ranking";
import {
  getHomepageStories,
} from "@/lib/story-repository";

// Reviewed publication is an editorial state transition, not a cache-refresh
// suggestion. Keep the durable homepage request-driven so a deliberately
// published/corrected/archived story is reflected on the next page load.
export const dynamic = "force-dynamic";

export default async function Home() {
  const stories = rankHomepageStories(await getHomepageStories());
  // Evaluation branch only: expose unreviewed RSS discovery without granting
  // publication, corroboration, or automatic homepage-lead status.
  // Do not merge this opt-in bypass into the production branch.
  const showLiveBeta = true;
  const liveFeed = await getLivePreviewStoriesForEvaluation();

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
      {liveFeed.stories.length === 0 && (
        <section aria-label="Live discovery status" className="mx-auto max-w-5xl px-6 py-4 text-sm">
          No live RSS discovery reports are currently available. This does not
          mean that any report has been independently verified or published.
        </section>
      )}
      <SiteFooter showLiveBeta={showLiveBeta} />
    </>
  );
}

async function getLivePreviewStoriesForEvaluation() {
  // The repository getter remains opt-in for ordinary deployments. This
  // preview intentionally calls the same sanitized RSS pipeline directly.
  const { getLiveFeed } = await import("@/lib/live-data");
  return getLiveFeed();
}
