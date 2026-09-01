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
import { useCallback, useEffect, useMemo } from "react";
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
  livePreviewStories = [],
  showLiveBeta = false,
  liveFeedSource = "cache",
  liveFeedFetchedAt = null,
}: StoryFeedProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const refreshTimer = window.setInterval(
      () => router.refresh(),
      5 * 60 * 1000,
    );
    return () => window.clearInterval(refreshTimer);
  }, [router]);

  const allStories = useMemo(
    () => rankStoriesByPriority(showLiveBeta ? livePreviewStories : []),
    [livePreviewStories, showLiveBeta],
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
      if (category) {
        params.set("category", category);
      } else {
        params.delete("category");
      }
      const query = params.toString();
      router.push(query ? `/?${query}` : "/", { scroll: false });
    },
    [router, searchParams],
  );

  const filtered = useMemo(
    () => rankStoriesByPriority(filterByCategory(allStories, activeCategory)),
    [allStories, activeCategory],
  );

  const topPriority = useMemo(
    () => getHighestPriorityStory(filtered.filter((story) => !isSocialOnlyStory(story))),
    [filtered],
  );

  const remainingStories = useMemo(
    () => filtered.filter((story) => story.id !== topPriority?.id),
    [filtered, topPriority],
  );

  const healthStories = useMemo(
    () => rankStoriesByPriority(allStories.filter((s) => s.category === "Health")),
    [allStories],
  );

  const counts = useMemo(() => categoryCounts(allStories), [allStories]);

  if (!showLiveBeta || allStories.length === 0) {
    return (
      <div className="desk-card border-dashed px-6 py-8 text-center">
        <p className="desk-kicker text-[9px] text-[var(--accent-muted)]">
          Live desk temporarily unavailable
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          The Fact Desk does not substitute demonstration stories when live data is unavailable. Automatic source refresh will retry.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <MobilePriorityRail stories={filtered} />
      <EarlySignalRail stories={filtered} />

      {topPriority && (
        <section aria-labelledby="top-priority-heading">
          <h2 id="top-priority-heading" className="sr-only">
            Top priority
          </h2>
          <LeadSignal story={topPriority} />
        </section>
      )}

      <DeskTicker stories={allStories} />

      <CategoryFilter
        active={activeCategory}
        onChange={setCategory}
        counts={counts}
      />

      {filtered.length === 0 && (
        <div className="desk-card border-dashed px-6 py-8 text-center">
          <p className="text-sm text-[var(--muted)]">
            No live stories are currently available in this category.
          </p>
          <button
            type="button"
            onClick={() => setCategory(null)}
            className="mt-3 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            View all desks
          </button>
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
            title="Live health updates"
            description="Current health reporting from the same live source network, ranked by Fact Desk priority."
            stories={healthStories.slice(0, 8)}
          />
        ) : (
          <p className="text-[12px] text-[var(--muted-light)]">
            No live health stories are available right now.
          </p>
        )}
      </section>

      {remainingStories.length > 0 && (
        <LiveBetaFeed
          key={activeCategory ?? "all"}
          stories={remainingStories}
          activeCategory={activeCategory}
          source={liveFeedSource}
          fetchedAt={liveFeedFetchedAt}
        />
      )}
    </div>
  );
}
