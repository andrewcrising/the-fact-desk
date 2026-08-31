"use client";

import { ConfidenceLabel } from "@/components/ui/ConfidenceLabel";
import { DeskCard } from "@/components/ui/DeskCard";
import { DeskLabel } from "@/components/ui/DeskLabel";
import { SignalLabel } from "@/components/ui/SignalLabel";
import type { LiveDataSource } from "@/lib/live-data";
import { countStoriesByViewpoint } from "@/lib/viewpoints";
import {
  formatSourceSpread,
  formatStoryTime,
  getStoryPriority,
  partitionStoriesByPriority,
  type StoryPriority,
} from "@/lib/stories";
import type { Story, StoryCategory } from "@/types/story";
import Link from "next/link";
import { useState } from "react";

const MONITOR_PAGE_SIZE = 12;

interface LiveBetaFeedProps {
  stories: Story[];
  activeCategory?: StoryCategory | null;
  source?: LiveDataSource;
  fetchedAt?: string | null;
}

function priorityClass(priority: StoryPriority): string {
  if (priority === "Urgent") {
    return "bg-red-50 text-red-900 ring-red-200/80";
  }
  if (priority === "Major") {
    return "bg-amber-50 text-amber-900 ring-amber-200/80";
  }
  return "bg-slate-50 text-slate-700 ring-slate-200/80";
}

function priorityBorderClass(priority: StoryPriority): string {
  if (priority === "Urgent") return "border-l-red-500";
  if (priority === "Major") return "border-l-amber-400";
  return "border-l-slate-300";
}

function LiveBetaCard({ story }: { story: Story }) {
  const sourceUrls = story.sourceUrls ?? [];
  const linksAreAligned = sourceUrls.length === story.sources.length;
  const priority = getStoryPriority(story);

  return (
    <DeskCard className={`relative border-l-2 ${priorityBorderClass(priority)} transition-colors hover:border-[var(--border)]`}>
      <article className="relative px-4 py-3.5 sm:px-5">
        <Link
          href={`/story/${story.slug}`}
          className="absolute inset-0 z-0 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          aria-label={`Open Fact Desk synopsis: ${story.title}`}
        >
          <span className="sr-only">Open Fact Desk synopsis</span>
        </Link>

        <div className="pointer-events-none relative z-[1] mb-2 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${priorityClass(priority)}`}
          >
            {priority}
          </span>
          <ConfidenceLabel confidence={story.confidence} />
          <SignalLabel signal={story.signal} />
          <span className="text-[10px] text-[var(--muted-light)]">
            {formatSourceSpread(story.sources)}
          </span>
        </div>
        <h3 className="pointer-events-none relative z-[1] font-serif text-base font-semibold leading-snug text-[var(--foreground)] sm:text-lg">
          {story.title}
        </h3>
        <p className="pointer-events-none relative z-[1] mt-1.5 line-clamp-4 text-[13px] leading-relaxed text-[var(--muted)] sm:line-clamp-3">
          {story.summary}
        </p>
        <div className="relative z-10 mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2">
          <div className="pointer-events-none flex items-center gap-2">
            <time
              dateTime={story.updatedAt}
              className="font-mono text-[10px] text-[var(--muted-light)]"
            >
              {formatStoryTime(story.updatedAt)}
            </time>
            <span className="text-[10px] font-semibold text-[var(--accent)]">
              Fact Desk synopsis →
            </span>
          </div>
          <div
            className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-[11px]"
            aria-label="Story sources"
          >
            {story.sources.slice(0, 5).map((sourceName, index) => {
              const url = linksAreAligned ? sourceUrls[index] : undefined;
              return url ? (
                <a
                  key={`${sourceName}-${url}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-20 font-medium text-[var(--accent)] hover:underline"
                >
                  {sourceName} ↗
                </a>
              ) : (
                <span
                  key={`${sourceName}-${index}`}
                  className="text-[var(--muted-light)]"
                >
                  {sourceName}
                </span>
              );
            })}
            {story.sources.length > 5 && (
              <span className="text-[var(--muted-light)]">
                +{story.sources.length - 5} more
              </span>
            )}
          </div>
        </div>
      </article>
    </DeskCard>
  );
}

function PriorityLane({
  id,
  title,
  description,
  stories,
}: {
  id: string;
  title: string;
  description: string;
  stories: Story[];
}) {
  if (stories.length === 0) return null;

  return (
    <section aria-labelledby={`${id}-heading`} className="space-y-2">
      <div>
        <h3
          id={`${id}-heading`}
          className="text-[12px] font-semibold uppercase tracking-wide text-[var(--foreground)]"
        >
          {title}
        </h3>
        <p className="mt-0.5 text-[11px] leading-snug text-[var(--muted-light)]">
          {description}
        </p>
      </div>
      <div className="space-y-3">
        {stories.map((story) => (
          <LiveBetaCard key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
}

export function LiveBetaFeed({
  stories,
  activeCategory = null,
  source = "cache",
  fetchedAt,
}: LiveBetaFeedProps) {
  const activePublisherCount = new Set(
    stories.flatMap((story) => story.sources),
  ).size;
  const statusLine =
    source === "live"
      ? "Live sources connected · refreshes about every 5 minutes"
      : "Cached source fallback · automatic refresh will retry";
  const heading = activeCategory
    ? `${activeCategory} Priority Desk`
    : "Live Priority Desk";
  const buckets = partitionStoriesByPriority(stories);
  const viewpointCounts = countStoriesByViewpoint(stories);
  const bothSidesRepresented =
    viewpointCounts["left-of-center"] > 0 &&
    viewpointCounts["right-of-center"] > 0;
  const [visibleMonitorCount, setVisibleMonitorCount] = useState(
    MONITOR_PAGE_SIZE,
  );

  const visibleMonitorStories = buckets.monitor.slice(0, visibleMonitorCount);
  const remainingMonitorCount = Math.max(
    0,
    buckets.monitor.length - visibleMonitorStories.length,
  );

  return (
    <section
      id="live-beta"
      aria-labelledby="live-beta-heading"
      className="border-t border-[var(--border)] pt-4"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <DeskLabel id="live-beta-heading">{heading}</DeskLabel>
          <p className="mt-0.5 max-w-2xl text-[11px] leading-snug text-[var(--muted-light)]">
            {activePublisherCount} active publishers · ranked by impact, recency, and evidence depth
          </p>
          {bothSidesRepresented && (
            <p className="mt-0.5 hidden max-w-2xl text-[10px] leading-snug text-[var(--muted-light)] sm:block">
              Viewpoint guardrail active · left-of-center, center/mixed, right-of-center, and primary reporting are tracked separately from evidence confidence
            </p>
          )}
        </div>
        {fetchedAt && (
          <p className="font-mono text-[10px] text-[var(--muted-light)]">
            {statusLine} · last source check {formatStoryTime(fetchedAt)}
          </p>
        )}
      </div>

      {stories.length === 0 ? (
        <p className="desk-card border-dashed px-4 py-3 text-[13px] text-[var(--muted)]">
          {activeCategory
            ? `No live ${activeCategory.toLowerCase()} items are available right now.`
            : "Live feed unavailable. Automatic refresh will retry."}
        </p>
      ) : (
        <div className="space-y-5">
          <PriorityLane
            id="urgent-live"
            title={`Urgent · ${buckets.urgent.length}`}
            description="Highest public-impact and time-sensitive developments. These surface immediately, even when still single-source, with confidence warnings preserved."
            stories={buckets.urgent}
          />
          <PriorityLane
            id="major-live"
            title={`Major · ${buckets.major.length}`}
            description="Important developments with meaningful impact, recency, or growing evidence support."
            stories={buckets.major}
          />
          <PriorityLane
            id="monitor-live"
            title={`Monitor · ${buckets.monitor.length}`}
            description="Lower-urgency or thinly supported items kept active for awareness and promoted automatically if importance or corroboration increases."
            stories={visibleMonitorStories}
          />
          {remainingMonitorCount > 0 && (
            <button
              type="button"
              onClick={() =>
                setVisibleMonitorCount((count) => count + MONITOR_PAGE_SIZE)
              }
              className="desk-card min-h-11 w-full px-4 py-2.5 text-center text-[12px] font-semibold text-[var(--accent)] hover:border-[var(--accent-muted)] hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            >
              Show more Monitor stories · {remainingMonitorCount} remaining
            </button>
          )}
        </div>
      )}
    </section>
  );
}
