import { ConfidenceLabel } from "@/components/ui/ConfidenceLabel";
import { DeskCard } from "@/components/ui/DeskCard";
import { SignalLabel } from "@/components/ui/SignalLabel";
import { formatSourceSpread, formatStoryTime } from "@/lib/stories";
import type { Story } from "@/types/story";
import Link from "next/link";

interface StoryCardProps {
  story: Story;
}

export function StoryCard({ story }: StoryCardProps) {
  const keyFactsPreview = story.keyFacts?.slice(0, 2);

  return (
    <DeskCard className="group transition-colors hover:border-[var(--border)]">
      <Link href={`/story/${story.slug}`} className="block px-4 py-4 sm:px-5 sm:py-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <ConfidenceLabel confidence={story.confidence} />
          <SignalLabel signal={story.signal} />
          <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted-light)]">
            {story.category}
          </span>
          {story.trendingScore != null && (
            <span className="ml-auto flex items-center gap-1 rounded-sm bg-slate-50 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600 ring-1 ring-inset ring-slate-200">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-slate-400">
                <path d="M8 2v12M8 2l4 4M8 2L4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {story.trendingScore}
            </span>
          )}
        </div>

        <h3 className="font-serif text-lg font-semibold leading-snug tracking-tight text-[var(--foreground)] group-hover:text-[var(--accent)]">
          {story.title}
        </h3>

        <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">
          {story.summary}
        </p>

        {keyFactsPreview && keyFactsPreview.length > 0 && (
          <ul className="mt-3 space-y-1 border-l-2 border-[var(--border-subtle)] pl-3">
            {keyFactsPreview.map((fact) => (
              <li key={fact} className="text-[12px] leading-snug text-[var(--foreground)]">
                {fact}
              </li>
            ))}
            {(story.keyFacts?.length ?? 0) > 2 && (
              <li className="text-[11px] text-[var(--accent)]">
                +{(story.keyFacts?.length ?? 0) - 2} more facts →
              </li>
            )}
          </ul>
        )}

        {story.dataPoints && story.dataPoints.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {story.dataPoints.slice(0, 3).map((dp) => (
              <span key={dp.label} className="text-[11px] text-[var(--muted-light)]">
                <span className="font-medium text-[var(--foreground)]">{dp.value}</span>{" "}
                {dp.label}
              </span>
            ))}
          </div>
        )}

        <p className="mt-3 text-[12px] leading-relaxed text-[var(--muted-light)]">
          {formatSourceSpread(story.sources)}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3">
          <time
            dateTime={story.updatedAt}
            className="font-mono text-[11px] text-[var(--muted-light)]"
          >
            Updated {formatStoryTime(story.updatedAt)}
          </time>
          <span className="text-[12px] font-medium text-[var(--accent)]">
            Full briefing →
          </span>
        </div>
      </Link>
    </DeskCard>
  );
}
