"use client";

import { STORY_CATEGORIES } from "@/data/navigation";
import {
  HealthDeskIntro,
  HealthDeskTicker,
} from "@/components/health/HealthDeskHeader";
import {
  categoryCounts,
  filterByCategory,
  getTopSignalStory,
  storiesBySignal,
  storiesLowConfidence,
} from "@/lib/stories";
import type { LiveDataSource } from "@/lib/live-data";
import type { Story, StoryCategory } from "@/types/story";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { CategoryFilter } from "./CategoryFilter";
import { DeskTicker } from "./DeskTicker";
import { LeadSignal } from "./LeadSignal";
import { LiveBetaFeed } from "./LiveBetaFeed";
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

  const allStories = homepageStories;

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
    () => filterByCategory(allStories, activeCategory),
    [allStories, activeCategory],
  );

  const filteredLivePreviewStories = useMemo(
    () => filterByCategory(livePreviewStories, activeCategory),
    [livePreviewStories, activeCategory],
  );

  const topSignal = useMemo(() => getTopSignalStory(filtered), [filtered]);

  const otherTopSignals = useMemo(
    () =>
      storiesBySignal(filtered, "Top Signal").filter(
        (s) => s.id !== topSignal?.id,
      ),
    [filtered, topSignal],
  );

  const underCovered = useMemo(
    () => storiesBySignal(filtered, "Under-covered"),
    [filtered],
  );

  const crossAngle = useMemo(
    () => storiesBySignal(filtered, "Cross-angle"),
    [filtered],
  );

  const developing = useMemo(() => {
    const low = storiesLowConfidence(filtered);
    const seen = new Set<string>();
    return low.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [filtered]);

  const healthStories = useMemo(
    () => allStories.filter((s) => s.category === "Health"),
    [allStories],
  );

  const counts = useMemo(() => categoryCounts(allStories), [allStories]);

  return (
    <div className="space-y-3">
      {topSignal && (
        <section aria-labelledby="top-signal-heading">
          <h2 id="top-signal-heading" className="sr-only">
            Top Signal
          </h2>
          <LeadSignal story={topSignal} />
        </section>
      )}

      <DeskTicker stories={allStories} />

      <div className="space-y-3">
        <CategoryFilter
          active={activeCategory}
          onChange={setCategory}
          counts={counts}
        />

        {otherTopSignals.length > 0 && (
          <StorySection
            id="more-top-signals"
            title="More top signals"
            stories={otherTopSignals}
          />
        )}

        <StorySection
          id="under-covered"
          title="Under-covered"
          description="Public-interest signals with limited mainstream pickup."
          stories={underCovered}
        />

        <StorySection
          id="cross-angle"
          title="Cross-angle view"
          description="Multiple credible sources with differing emphasis."
          stories={crossAngle}
        />

        <StorySection
          id="developing"
          title="Developing / low confidence"
          description="Still forming, disputed, or thinly sourced — read with care."
          stories={developing}
        />

        {filtered.length === 0 && (
          <div className="desk-card border-dashed px-6 py-8 text-center">
            <p className="text-sm text-[var(--muted)]">
              No stories in this category.
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
      </div>

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
            title="Health desk preview"
            description="Health policy and research signals only; not medical advice."
            stories={healthStories}
          />
        ) : (
          <p className="text-[12px] text-[var(--muted-light)]">
            Health desk stories will appear here as coverage is added.
          </p>
        )}
      </section>

      {showLiveBeta && (
        <LiveBetaFeed
          stories={filteredLivePreviewStories}
          activeCategory={activeCategory}
          source={liveFeedSource}
          fetchedAt={liveFeedFetchedAt}
        />
      )}
    </div>
  );
}
