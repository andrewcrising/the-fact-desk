import { Dashboard } from "@/components/layout/Dashboard";
import { Hero } from "@/components/layout/Hero";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopNav } from "@/components/layout/TopNav";
import { rankHomepageStories } from "@/lib/homepage-ranking";
import { getHomepageStories } from "@/lib/story-repository";
import { getBoundedDiscovery } from "@/lib/discovery";

// Isolated evaluation branch: do not merge request-time discovery into production.
export const dynamic = "force-dynamic";


export default async function Home() {
  const [published, discovery] = await Promise.all([
    getHomepageStories().catch(() => []),
    getBoundedDiscovery(),
  ]);
  const stories = rankHomepageStories(published);
  return (
    <>
      <TopNav />
      <Hero />
      <Dashboard
        stories={stories}
        livePreviewStories={discovery.stories}
        liveFeedSource={discovery.source}
        liveFeedFetchedAt={discovery.fetchedAt}
        showLiveBeta={true}
      />
      {discovery.stories.length === 0 && (
        <section aria-label="Live discovery status" className="mx-auto max-w-5xl px-6 py-4 text-sm">
          Live RSS discovery is temporarily unavailable. No unreviewed report has
          been promoted to verified or published status.
        </section>
      )}
      <SiteFooter showLiveBeta={true} />
    </>
  );
}
