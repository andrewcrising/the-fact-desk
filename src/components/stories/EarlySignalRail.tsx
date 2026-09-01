import { DeskLabel } from "@/components/ui/DeskLabel";
import {
  formatStoryTime,
  independentEvidenceSourceCount,
  isSocialOnlyStory,
  rankStoriesByPriority,
} from "@/lib/stories";
import type { Story } from "@/types/story";
import Link from "next/link";

interface EarlySignalRailProps {
  stories: Story[];
}

const BREAKING_WINDOW_MS = 90 * 60 * 1000;

function isRecentBreakingReport(story: Story, nowMs: number): boolean {
  const updatedMs = Date.parse(story.updatedAt);
  if (!Number.isFinite(updatedMs)) return false;

  const ageMs = Math.max(0, nowMs - updatedMs);
  const thinEvidence =
    story.confidence === "Single-source" ||
    independentEvidenceSourceCount(story) <= 1;

  return (
    ageMs <= BREAKING_WINDOW_MS &&
    thinEvidence &&
    story.signal === "Developing"
  );
}

function isEarlySignal(story: Story, nowMs: number): boolean {
  return isSocialOnlyStory(story) || isRecentBreakingReport(story, nowMs);
}

export function EarlySignalRail({ stories }: EarlySignalRailProps) {
  const nowMs = Date.now();
  const earlySignals = rankStoriesByPriority(
    stories.filter((story) => isEarlySignal(story, nowMs)),
  ).slice(0, 8);

  return (
    <section aria-labelledby="early-signal-heading">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <DeskLabel id="early-signal-heading">Developing / Early Signals</DeskLabel>
        <span className="text-[10px] font-medium text-[var(--muted-light)]">
          Social + breaking reports
        </span>
      </div>

      {earlySignals.length > 0 ? (
        <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          {earlySignals.map((story) => {
            const socialOnly = isSocialOnlyStory(story);
            return (
              <Link
                key={story.id}
                href={`/story/${story.slug}`}
                className="desk-card w-[78vw] max-w-[19rem] shrink-0 snap-start border-l-2 border-l-slate-300 px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 sm:w-[22rem]"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {socialOnly
                      ? "Social signal · unverified"
                      : "Breaking report · limited evidence"}
                  </span>
                  <time
                    dateTime={story.updatedAt}
                    className="shrink-0 font-mono text-[9px] text-[var(--muted-light)]"
                  >
                    {formatStoryTime(story.updatedAt)}
                  </time>
                </div>
                <h2 className="line-clamp-2 font-serif text-sm font-semibold leading-snug text-[var(--foreground)]">
                  {story.title}
                </h2>
                <p className="mt-1 line-clamp-1 text-[10px] text-[var(--muted-light)]">
                  {story.sources.join(" · ")}
                </p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="desk-card border-dashed px-3 py-2 text-[11px] text-[var(--muted-light)]">
          No active early signals right now. This lane only shows social signals and very recent, thinly corroborated breaking reports.
        </div>
      )}

      <p className="mt-1 text-[9px] leading-snug text-[var(--muted-light)]">
        This lane is for discovery: social signals and breaking reports from the last 90 minutes. Routine developing or under-covered stories stay in the main desk rather than repeating here.
      </p>
    </section>
  );
}
