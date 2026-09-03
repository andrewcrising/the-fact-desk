"use client";

import { STORY_CATEGORIES } from "@/data/navigation";
import { ReaderSupportCard } from "@/components/support/ReaderSupportCard";
import {
  HealthDeskIntro,
  HealthDeskTicker,
} from "@/components/health/HealthDeskHeader";
import {
  categoryCounts,
  filterByCategory,
  getHighestPriorityStory,
  isSocialOnlyStory,
  rankStoriesByPriority,
} from "@/lib/stories";
import type { LiveDataSource } from "@/lib/live-data";
import type { Story, StoryCategory } from "@/types/story";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { CategoryFilter } from "./CategoryFilter";
import { DeskTicker } from "./DeskTicker";
import { EarlySignalRail } from "./EarlySignalRail";
import { LeadSignal } from "./LeadSignal";
import { LiveBetaFeed } from "./LiveBetaFeed";
import { MobilePriorityRail } from "./MobilePriorityRail";
import { StorySection } from "./StorySection";

interface StoryFeedProps {
  stories: Story[];
  livePreviewStories?: Story[];
  showLiveBeta?: boolean;
  liveFeedSource?: LiveDataSource;
  liveFeedFetchedAt?: string | null;
}

export function StoryFeed({
  stories: homepageStories,
  livePreviewStories = [],
  showLiveBeta = false,
  liveFeedSource = "cache",
  liveFeedFetchedAt = null,
}: StoryFeedProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Published Supabase stories are the durable desk of record. Direct live
  // ingestion is a discovery/diagnostic lane and must never silently replace it.
  const allStories = useMemo(
    () => rankStoriesByPriority(homepageStories),
    [homepageStories],
  );

  const activeCategory = useMemo(() => {
    const raw = searchParams.get("category");
    if (!raw) return null;
    return STORY_CATEGORIES.includes(raw as StoryCategory)
      ? (raw as StoryCategory)
      : null;
  }, [searchParams]);

  const setCategory = useCallback(
    (category: StoryCategory | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (category) params.set("category", category);
      else params.delete("category");
      const query = params.toString();
      router.push(query ? `/?${query}` : "/", { scroll: false });
    },
    [router, searchParams],
  );

  const filtered = useMemo(
    () => rankStoriesByPriority(filterByCategory(allStories, activeCategory)),
    [allStories, activeCategory],
  );

  const discoveryStories = useMemo(
    () =>
      rankStoriesByPriority(
        filterByCategory(showLiveBeta ? livePreviewStories : [], activeCategory),
      ),
    [activeCategory, livePreviewStories, showLiveBeta],
  );

  const publisherStories = useMemo(
    () => filtered.filter((story) => !isSocialOnlyStory(story)),
    [filtered],
  );

  const topPriority = useMemo(
    () => getHighestPriorityStory(publisherStories),
    [publisherStories],
  );

  const priorityRailStories = useMemo(
    () => rankStoriesByPriority(publisherStories).slice(0, 4),
    [publisherStories],
  );

  const earlySignalExclusions = useMemo(() => {
    const byId = new Map<string, Story>();
    for (const story of priorityRailStories) byId.set(story.id, story);
    if (topPriority) byId.set(topPriority.id, topPriority);
    return [...byId.values()];
  }, [priorityRailStories, topPriority]);

  const remainingStories = useMemo(
    () => publisherStories.filter((story) => story.id !== topPriority?.id),
    [publisherStories, topPriority],
  );

  const healthStories = useMemo(
    () => rankStoriesByPriority(allStories.filter((story) => story.category === "Health")),
    [allStories],
  );

  const counts = useMemo(() => categoryCounts(allStories), [allStories]);

  return (
    <div className="space-y-3">
      {publisherStories.length > 0 && <MobilePriorityRail stories={publisherStories} />}

      {showLiveBeta && discoveryStories.length > 0 && (
        <EarlySignalRail
          stories={discoveryStories}
          excludedStories={earlySignalExclusions}
        />
      )}

      {topPriority && (
        <section aria-labelledby="top-priority-heading">
          <h2 id="top-priority-heading" className="sr-only">
            Top priority
          </h2>
          <LeadSignal story={topPriority} />
        </section>
      )}

      <DeskTicker stories={allStories} />

      <CategoryFilter active={activeCategory} onChange={setCategory} counts={counts} />

      {filtered.length === 0 && (
        <div className="desk-card border-dashed px-6 py-8 text-center">
          <p className="text-sm text-[var(--muted)]">
            No reviewed stories are currently published in this category.
          </p>
          {activeCategory && (
            <button
              type="button"
              onClick={() => setCategory(null)}
              className="mt-3 text-sm font-medium text-[var(--accent)] hover:underline"
            >
              View all desks
            </button>
          )}
        </div>
      )}

      <ReaderSupportCard className="lg:hidden" />

      <section
        id="health-desk"
        aria-labelledby="health-desk-heading"
        className="scroll-mt-20 space-y-2 border-t border-[var(--border)] pt-3"
      >
        <HealthDeskIntro />
        <HealthDeskTicker />
        {healthStories.length > 0 ? (
          <StorySection
            id="health-desk-stories"
            title="Reviewed health updates"
            description="Published health reporting ranked by Fact Desk priority; not medical advice."
            stories={healthStories.slice(0, 8)}
          />
        ) : (
          <p className="text-[12px] text-[var(--muted-light)]">
            No reviewed health stories are published right now.
          </p>
        )}
      </section>

      {remainingStories.length > 0 && (
        <StorySection
          id="reviewed-desk"
          title="More reviewed briefings"
          description="Published stories from the durable editorial desk."
          stories={remainingStories}
        />
      )}

      {showLiveBeta && discoveryStories.length > 0 && (
        <LiveBetaFeed
          stories={discoveryStories}
          activeCategory={activeCategory}
          source={liveFeedSource}
          fetchedAt={liveFeedFetchedAt}
        />
      )}
    </div>
  );
}
