import { ConfidenceLabel } from "@/components/ui/ConfidenceLabel";
import { DeskCard } from "@/components/ui/DeskCard";
import { DeskLabel } from "@/components/ui/DeskLabel";
import { SignalLabel } from "@/components/ui/SignalLabel";
import { formatSourceSpread, formatStoryTime } from "@/lib/stories";
import type { Story } from "@/types/story";
import Link from "next/link";

interface LeadSignalProps {
  story: Story;
}

export function LeadSignal({ story }: LeadSignalProps) {
  return (
    <DeskCard variant="featured" id="top-signal" className="scroll-mt-20 overflow-hidden">
      <div className="border-b-2 border-[var(--lead-accent)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-white px-3 py-2 sm:px-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <DeskLabel className="!text-[var(--accent)]">Top Signal</DeskLabel>
            <ConfidenceLabel confidence={story.confidence} />
            <SignalLabel signal={story.signal} />
          </div>
          <time
            dateTime={story.updatedAt}
            className="font-mono text-[10px] text-[var(--muted-light)]"
          >
            {formatStoryTime(story.updatedAt)}
          </time>
        </div>

        <div className="bg-white px-3 py-3 sm:px-4 sm:py-3.5">
          <Link href={`/story/${story.slug}`} className="group block">
            <h2 className="max-w-3xl font-serif text-lg font-semibold leading-snug tracking-tight text-[var(--foreground)] group-hover:text-[var(--accent)] sm:text-xl">
              {story.title}
            </h2>
            <p className="mt-1.5 max-w-3xl text-[13px] leading-snug text-[var(--muted)] sm:text-sm">
              {story.summary}
            </p>
          </Link>

          <div className="mt-3 grid gap-2 border-t border-[var(--border-subtle)] pt-3 sm:grid-cols-2">
            <div>
              <p className="desk-kicker mb-1 text-[9px]">What happened</p>
              <p className="line-clamp-3 text-[13px] leading-snug text-[var(--foreground)]">
                {story.whatHappened}
              </p>
            </div>
            <div>
              <p className="desk-kicker mb-1 text-[9px]">Why it matters</p>
              <p className="line-clamp-3 text-[13px] leading-snug text-[var(--muted)]">
                {story.whyItMatters}
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-[var(--muted-light)]">
              {formatSourceSpread(story.sources)}
            </p>
            <Link
              href={`/story/${story.slug}`}
              className="text-[12px] font-medium text-[var(--accent)] hover:underline"
            >
              Full briefing →
            </Link>
          </div>
        </div>
      </div>
    </DeskCard>
  );
}
