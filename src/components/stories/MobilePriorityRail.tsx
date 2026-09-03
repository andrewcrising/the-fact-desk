import { ConfidenceLabel } from "@/components/ui/ConfidenceLabel";
import { DeskLabel } from "@/components/ui/DeskLabel";
import {
  formatStoryTime,
  getStoryPriority,
  isSocialOnlyStory,
  rankStoriesByPriority,
} from "@/lib/stories";
import type { Story } from "@/types/story";
import Link from "next/link";

interface MobilePriorityRailProps {
  stories: Story[];
}

export function MobilePriorityRail({ stories }: MobilePriorityRailProps) {
  const priorityStories = rankStoriesByPriority(
    stories.filter((story) => !isSocialOnlyStory(story)),
  ).slice(0, 4);
  if (priorityStories.length === 0) return null;

  return (
    <section aria-labelledby="mobile-priority-heading" className="lg:hidden">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <DeskLabel id="mobile-priority-heading">Priority Now</DeskLabel>
        <span className="inline-flex items-center gap-1.5 text-[10px] text-[var(--muted-light)]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden />
          Live and updating
        </span>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {priorityStories.map((story) => (
          <Link
            key={story.id}
            href={`/story/${story.slug}`}
            className="desk-card w-[78vw] max-w-[19rem] shrink-0 snap-start border-l-2 border-l-[var(--accent)] px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                  {getStoryPriority(story)}
                </span>
                <ConfidenceLabel confidence={story.confidence} />
              </div>
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
        ))}
      </div>
    </section>
  );
}
