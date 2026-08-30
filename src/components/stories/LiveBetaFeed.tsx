import { ConfidenceLabel } from "@/components/ui/ConfidenceLabel";
import { DeskCard } from "@/components/ui/DeskCard";
import { DeskLabel } from "@/components/ui/DeskLabel";
import { SignalLabel } from "@/components/ui/SignalLabel";
import type { LiveDataSource } from "@/lib/live-data";
import { formatSourceSpread, formatStoryTime } from "@/lib/stories";
import type { Story } from "@/types/story";

interface LiveBetaFeedProps {
  stories: Story[];
  source?: LiveDataSource;
  fetchedAt?: string | null;
}

function LiveBetaCard({ story }: { story: Story }) {
  const externalUrl = story.sourceUrls?.[0];

  const content = (
    <>
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
        {externalUrl && (
          <span className="text-[12px] font-medium text-[var(--accent)]">
            Read at source →
          </span>
        )}
      </div>
    </>
  );

  return (
    <DeskCard className="transition-colors hover:border-[var(--border)]">
      {externalUrl ? (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block px-4 py-3.5 sm:px-5"
        >
          {content}
        </a>
      ) : (
        <div className="px-4 py-3.5 sm:px-5">{content}</div>
      )}
    </DeskCard>
  );
}

export function LiveBetaFeed({
  stories,
  source = "cache",
  fetchedAt,
}: LiveBetaFeedProps) {
  const statusLine =
    source === "live"
      ? "Live sources connected · auto-refreshes about every 15 minutes"
      : "Cached source fallback · automatic refresh will retry";

  return (
    <section
      id="live-beta"
      aria-labelledby="live-beta-heading"
      className="border-t border-[var(--border)] pt-4"
    >
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <DeskLabel id="live-beta-heading">Live News Feed</DeskLabel>
          <p className="mt-0.5 text-[11px] text-[var(--muted-light)]">
            Current external headlines · single-source · not yet evidence-ranked
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
          Live beta feed unavailable. Mock briefing remains available.
        </p>
      ) : (
        <div className="space-y-3">
          {stories.map((story) => (
            <LiveBetaCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </section>
  );
}
