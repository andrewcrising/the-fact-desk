import { ConfidenceLabel } from "@/components/ui/ConfidenceLabel";
import { SidebarPanel } from "@/components/ui/SidebarPanel";
import {
  formatStoryTime,
  getStoryPriority,
  rankStoriesByPriority,
} from "@/lib/stories";
import type { Story } from "@/types/story";
import Link from "next/link";

interface LiveSignalsProps {
  stories: Story[];
}

export function LiveSignals({ stories }: LiveSignalsProps) {
  const topStories = rankStoriesByPriority(stories).slice(0, 4);

  if (topStories.length === 0) return null;

  return (
    <SidebarPanel
      title="Priority Now"
      action={
        <span className="h-2 w-2 rounded-full bg-emerald-600" title="Live desk active" />
      }
    >
      <ul className="divide-y divide-[var(--border-subtle)]">
        {topStories.map((story) => (
          <li key={story.id} className="py-3 first:pt-0 last:pb-0">
            <Link href={`/story/${story.slug}`} className="group block">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                    {getStoryPriority(story)}
                  </span>
                  <ConfidenceLabel confidence={story.confidence} />
                </div>
                <time
                  dateTime={story.updatedAt}
                  className="font-mono text-[10px] text-[var(--muted-light)]"
                >
                  {formatStoryTime(story.updatedAt)}
                </time>
              </div>
              <p className="text-[13px] leading-snug text-[var(--foreground)] group-hover:text-[var(--accent)]">
                {story.title}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </SidebarPanel>
  );
}
