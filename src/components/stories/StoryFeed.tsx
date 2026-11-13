"use client";

import { STORY_CATEGORIES } from "@/data/navigation";
import { safeArticleUrl } from "@/lib/article-source-links";
import { deduplicateReaderStories } from "@/lib/reader-stories";
import { ReaderSupportCard } from "@/components/support/ReaderSupportCard";
import {
  HealthDeskIntro,
  HealthDeskTicker,
} from "@/components/health/HealthDeskHeader";
import {
  categoryCounts,
  filterByCategory,
  getHighestPriorityStory,
  isAutomaticLeadEligible,
  isSocialOnlyStory,
  rankStoriesByPriority,
} from "@/lib/stories";
import type { LiveDataSource } from "@/lib/live-data";
import type { Story, StoryCategory } from "@/types/story";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useEffect } from "react";
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

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [router]);

  // Published Supabase stories are the durable desk of record. Direct live
  // ingestion is a discovery/diagnostic lane and must never silently replace it.
  const allStories = useMemo(
    () => deduplicateReaderStories(rankStoriesByPriority(homepageStories)),
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
        filterByCategory(deduplicateReaderStories(showLiveBeta ? livePreviewStories : [], allStories), activeCategory),
      ),
    [activeCategory, livePreviewStories, showLiveBeta, allStories],
  );

  const publisherStories = useMemo(
    () => filtered.filter((story) => !isSocialOnlyStory(story)),
    [filtered],
  );

  const topPriority = useMemo(() => {
    // Preserve explicit editorial lead selections. Unreviewed source counts
    // cannot produce an automatic public lead.
    const editorialLead = publisherStories.find(
      (story) => "isLead" in story && story.isLead === true,
    );
    return editorialLead ?? getHighestPriorityStory(
      publisherStories.filter(isAutomaticLeadEligible),
    ) ?? getHighestPriorityStory(publisherStories);
  }, [publisherStories]);

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
    () => remainingStories.filter((story) => story.category === "Health"),
    [remainingStories],
  );
  const counts = useMemo(() => categoryCounts([
    ...allStories, ...deduplicateReaderStories(showLiveBeta ? livePreviewStories : [], allStories),
  ]), [allStories, livePreviewStories, showLiveBeta]);
  const discoveryLead = !topPriority ? discoveryStories.find((story) => safeArticleUrl(story.sourceUrls?.[0])) : undefined;
  const secondaryDiscovery = discoveryStories.filter((story) => story.id !== discoveryLead?.id);

  return (
    <div className="space-y-3">
      {remainingStories.length > 0 && <MobilePriorityRail stories={remainingStories} />}

      {showLiveBeta && discoveryStories.some(isSocialOnlyStory) && (
        <EarlySignalRail
          stories={discoveryStories}
          excludedStories={earlySignalExclusions}
        />
      )}

      {!topPriority && discoveryLead && (
        <section aria-label="Leading unreviewed discovery" className="desk-card border-l-4 border-l-amber-400 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            Lead story · source report · unreviewed
          </p>
          <a href={safeArticleUrl(discoveryLead.sourceUrls?.[0]) || "#"} target="_blank" rel="noopener noreferrer"
            className="mt-1 block font-serif text-xl font-semibold hover:underline">
            {discoveryLead.title}
          </a>
          <p className="mt-1 text-sm text-[var(--muted)]">{discoveryLead.summary}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
            {discoveryLead.sources.map((source, index) => {
              const url = safeArticleUrl(discoveryLead.sourceUrls?.[index]);
              return url ? <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">{source}</a> : null;
            })}
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">Related reports do not establish independently verified coverage.</p>
        </section>
      )}
      {topPriority && (
        <section aria-labelledby="top-priority-heading">
          <h2 id="top-priority-heading" className="sr-only">
            Top priority
          </h2>
          <LeadSignal story={topPriority} />
        </section>
      )}

      <DeskTicker stories={allStories} discoveryStories={discoveryStories} />

      <CategoryFilter active={activeCategory} onChange={setCategory} counts={counts} />

      {filtered.length === 0 && discoveryStories.length === 0 && (
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

      {(!activeCategory || activeCategory === "Health") && <section
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
      </section>}

      {remainingStories.length > 0 && (
        <StorySection
          id="reviewed-desk"
          title="More reviewed briefings"
          description="Published stories from the durable editorial desk."
          stories={remainingStories.filter((story) => story.category !== "Health")}
        />
      )}

      {showLiveBeta && secondaryDiscovery.length > 0 && (
        <LiveBetaFeed
          stories={secondaryDiscovery}
          activeCategory={activeCategory}
          source={liveFeedSource}
          fetchedAt={liveFeedFetchedAt}
        />
      )}
    </div>
  );
}
