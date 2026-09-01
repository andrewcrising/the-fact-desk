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

function isEarlySignal(story: Story): boolean {
  return (
    isSocialOnlyStory(story) ||
    story.confidence === "Single-source" ||
    (independentEvidenceSourceCount(story) <= 1 &&
      (story.signal === "Under-covered" || story.signal === "Developing"))
  );
}

export function EarlySignalRail({ stories }: EarlySignalRailProps) {
  const earlySignals = rankStoriesByPriority(stories.filter(isEarlySignal)).slice(0, 6);
  if (earlySignals.length === 0) return null;

  return (
    <section aria-labelledby="early-signal-heading" className="lg:hidden">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <DeskLabel id="early-signal-heading">Early Signals</DeskLabel>
        <span className="text-[10px] font-medium text-[var(--muted-light)]">
          Unverified / thin evidence
        </span>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {earlySignals.map((story) => {
          const socialOnly = isSocialOnlyStory(story);
          return (
            <Link
              key={story.id}
              href={`/story/${story.slug}`}
              className="desk-card w-[78vw] max-w-[19rem] shrink-0 snap-start border-l-2 border-l-slate-300 px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[9px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {socialOnly ? "Social signal · unverified" : "Early report · single-source"}
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
      <p className="mt-1 text-[9px] leading-snug text-[var(--muted-light)]">
        Early signals are surfaced for awareness before corroboration. They do not count as confirmed reporting.
      </p>
    </section>
  );
}
