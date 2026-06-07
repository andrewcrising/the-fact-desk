import { ConfidenceLabel } from "@/components/ui/ConfidenceLabel";
import { DeskCard } from "@/components/ui/DeskCard";
import { EvidenceLabel } from "@/components/ui/EvidenceLabel";
import { SignalLabel } from "@/components/ui/SignalLabel";
import { formatSourceSpread, formatStoryTime } from "@/lib/stories";
import type { Story } from "@/types/story";
import Link from "next/link";

interface StoryCardProps {
  story: Story;
}

export function StoryCard({ story }: StoryCardProps) {
  return (
    <DeskCard className="group transition-colors hover:border-[var(--border)]">
      <Link href={`/story/${story.slug}`} className="block px-4 py-4 sm:px-5 sm:py-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <ConfidenceLabel confidence={story.confidence} />
          <EvidenceLabel evidenceLevel={story.evidenceLevel} />
          <SignalLabel signal={story.signal} />
          <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted-light)]">
            {story.category}
          </span>
        </div>

        <h3 className="font-serif text-lg font-semibold leading-snug tracking-tight text-[var(--foreground)] group-hover:text-[var(--accent)]">
          {story.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-[var(--muted)]">
          {story.summary}
        </p>

        <p className="mt-3 text-[12px] leading-relaxed text-[var(--muted-light)]">
          {formatSourceSpread(story.sources)} · {story.sources.length} source
          {story.sources.length === 1 ? "" : "s"} reviewed
        </p>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3">
          <time
            dateTime={story.updatedAt}
            className="font-mono text-[11px] text-[var(--muted-light)]"
          >
            Updated {formatStoryTime(story.updatedAt)}
          </time>
          <span className="text-[12px] font-medium text-[var(--accent)]">
            Read briefing →
          </span>
        </div>
      </Link>
    </DeskCard>
  );
}
