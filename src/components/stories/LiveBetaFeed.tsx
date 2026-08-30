import { ConfidenceLabel } from "@/components/ui/ConfidenceLabel";
import { DeskCard } from "@/components/ui/DeskCard";
import { DeskLabel } from "@/components/ui/DeskLabel";
import { SignalLabel } from "@/components/ui/SignalLabel";
import type { LiveDataSource } from "@/lib/live-data";
import {
  formatSourceSpread,
  formatStoryTime,
  partitionLiveStoriesByEvidence,
} from "@/lib/stories";
import type { Story, StoryCategory } from "@/types/story";

interface LiveBetaFeedProps {
  stories: Story[];
  activeCategory?: StoryCategory | null;
  source?: LiveDataSource;
  fetchedAt?: string | null;
}

function LiveBetaCard({ story }: { story: Story }) {
  const sourceUrls = story.sourceUrls ?? [];
  const linksAreAligned = sourceUrls.length === story.sources.length;

  return (
    <DeskCard className="transition-colors hover:border-[var(--border)]">
      <article className="px-4 py-3.5 sm:px-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <ConfidenceLabel confidence={story.confidence} />
          <SignalLabel signal={story.signal} />
          <span className="text-[10px] text-[var(--muted-light)]">
            {formatSourceSpread(story.sources)}
          </span>
        </div>
        <h3 className="font-serif text-base font-semibold leading-snug text-[var(--foreground)] sm:text-lg">
          {story.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-[var(--muted)]">
          {story.summary}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2">
          <time
            dateTime={story.updatedAt}
            className="font-mono text-[10px] text-[var(--muted-light)]"
          >
            {formatStoryTime(story.updatedAt)}
          </time>
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
                  className="font-medium text-[var(--accent)] hover:underline"
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

function EvidenceLane({
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
      ? "Live sources connected · auto-refreshes about every 15 minutes"
      : "Cached source fallback · automatic refresh will retry";
  const heading = activeCategory
    ? `${activeCategory} Evidence Feed`
    : "Evidence-ranked Live Feed";
  const buckets = partitionLiveStoriesByEvidence(stories);

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
            {activePublisherCount} active publishers · multi-source coverage leads;
            single-newsroom items stay incoming until better supported
          </p>
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
            : "Live feed unavailable. The editorial preview remains available."}
        </p>
      ) : (
        <div className="space-y-5">
          <EvidenceLane
            id="multi-source-live"
            title={`Multi-source coverage · ${buckets.multiSource.length}`}
            description="Reported by at least two distinct publishers or source domains. Better supported, but not automatically confirmed."
            stories={buckets.multiSource}
          />
          <EvidenceLane
            id="primary-live"
            title={`Primary-source updates · ${buckets.primaryOnly.length}`}
            description="Direct government, court, regulator, academic, or other primary material. Strong for what the issuer said; broader claims may still need independent confirmation."
            stories={buckets.primaryOnly}
          />
          <EvidenceLane
            id="incoming-live"
            title={`Incoming signals · ${buckets.incoming.length}`}
            description="Single-newsroom coverage. Visible for awareness, but intentionally below better-supported reporting until corroborated."
            stories={buckets.incoming}
          />
        </div>
      )}
    </section>
  );
}
