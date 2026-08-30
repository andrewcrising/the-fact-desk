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
            {story.trendingScore != null && (
              <span className="flex items-center gap-1 rounded-sm bg-slate-50 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600 ring-1 ring-inset ring-slate-200">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-slate-400">
                  <path d="M8 2v12M8 2l4 4M8 2L4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Trending {story.trendingScore}
              </span>
            )}
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

          {story.keyFacts && story.keyFacts.length > 0 && (
            <div className="mt-3 border-t border-[var(--border-subtle)] pt-3">
              <p className="desk-kicker mb-1.5 text-[9px]">Key facts</p>
              <ul className="space-y-1 border-l-2 border-[var(--accent)]/20 pl-3">
                {story.keyFacts.slice(0, 4).map((fact) => (
                  <li key={fact} className="text-[12px] leading-snug text-[var(--foreground)]">
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {story.dataPoints && story.dataPoints.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3 border-t border-[var(--border-subtle)] pt-3">
              {story.dataPoints.slice(0, 4).map((dp) => (
                <div key={dp.label} className="min-w-[100px]">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--muted-light)]">{dp.label}</p>
                  <p className="font-mono text-sm font-semibold text-[var(--foreground)]">{dp.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 grid gap-2 border-t border-[var(--border-subtle)] pt-3 sm:grid-cols-2">
            <div>
              <p className="desk-kicker mb-1 text-[9px]">What happened</p>
              <p className="line-clamp-3 text-[13px] leading-snug text-[var(--foreground)]">
                {story.whatHappened}
              </p>
            </div>
            <div>
              <p className="desk-kicker mb-1 text-[9px]">Impact</p>
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
