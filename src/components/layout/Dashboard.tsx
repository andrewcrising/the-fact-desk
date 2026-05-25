import { StoryFeed } from "@/components/stories/StoryFeed";
import { Sidebar } from "@/components/sidebar/Sidebar";
import type { LiveDataSource } from "@/lib/live-data";
import type { Story } from "@/types/story";
import { Suspense } from "react";

interface DashboardProps {
  stories: Story[];
  livePreviewStories?: Story[];
  showLiveBeta?: boolean;
  liveFeedSource?: LiveDataSource;
  liveFeedFetchedAt?: string | null;
}

function FeedFallback() {
  return (
    <div className="space-y-4">
      <div className="desk-card h-48 animate-pulse bg-slate-50" />
      <div className="desk-card h-32 animate-pulse bg-slate-50" />
    </div>
  );
}

export function Dashboard({
  stories,
  livePreviewStories = [],
  showLiveBeta = false,
  liveFeedSource = "cache",
  liveFeedFetchedAt = null,
}: DashboardProps) {
  return (
    <div className="desk-canvas flex-1">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-5 lg:px-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main id="stories" className="min-w-0">
          <Suspense fallback={<FeedFallback />}>
            <StoryFeed
              stories={stories}
              livePreviewStories={livePreviewStories}
              showLiveBeta={showLiveBeta}
              liveFeedSource={liveFeedSource}
              liveFeedFetchedAt={liveFeedFetchedAt}
            />
          </Suspense>
        </main>
        <aside className="space-y-3 lg:sticky lg:top-[5.5rem] lg:max-h-[calc(100vh-6.5rem)] lg:self-start lg:overflow-y-auto lg:pb-4">
          <Sidebar />
        </aside>
      </div>
    </div>
  );
}
