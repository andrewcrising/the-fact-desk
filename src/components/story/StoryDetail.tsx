import { ConfidenceLabel } from "@/components/ui/ConfidenceLabel";
import { SignalLabel } from "@/components/ui/SignalLabel";
import {
  formatSourceSpread,
  formatStoryTime,
  getStoryPriority,
} from "@/lib/stories";
import type { Story } from "@/types/story";
import Link from "next/link";

interface StoryDetailProps {
  story: Story;
}

export function StoryDetail({ story }: StoryDetailProps) {
  const sourceUrls = story.sourceUrls ?? [];
  const linksAreAligned = sourceUrls.length === story.sources.length;
  const priority = getStoryPriority(story);

  return (
    <article className="mx-auto max-w-3xl">
      <Link
        href="/"
        className="mb-6 inline-flex text-sm font-medium text-[var(--accent)] hover:underline"
      >
        ← Back to desk
      </Link>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="desk-kicker text-[var(--accent-muted)]">
          Fact Desk synopsis · live
        </p>
        <Link
          href="/independence"
          className="inline-flex min-h-7 items-center text-[10px] font-medium text-[var(--muted-light)] hover:text-[var(--accent)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 sm:text-[11px]"
        >
          Reader-supported · Independence &amp; funding →
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
          {priority} priority
        </span>
        <ConfidenceLabel confidence={story.confidence} />
        <SignalLabel signal={story.signal} />
        <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-light)]">
          {story.category}
        </span>
      </div>

      <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-4xl">
        {story.title}
      </h1>

      {story.headlineSource && (
        <p className="mt-2 text-[11px] text-[var(--muted-light)]">
          Source headline via {story.headlineSource} · Fact Desk briefing below
        </p>
      )}

      {story.synthesis && (
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--muted-light)]">
          Original evidence synthesis · {story.synthesis.sourceCount} attributed
          {story.synthesis.sourceCount === 1 ? " source" : " sources"} ·{" "}
          {story.synthesis.claimCount} supported
          {story.synthesis.claimCount === 1 ? " claim" : " claims"}
        </p>
      )}

      <p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">
        {story.summary}
      </p>

      <dl className="mt-6 grid gap-4 border-y border-[var(--border-subtle)] py-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="desk-kicker mb-1">Source coverage</dt>
          <dd className="text-[var(--foreground)]">
            {formatSourceSpread(story.sources)}
          </dd>
        </div>
        <div>
          <dt className="desk-kicker mb-1">Updated</dt>
          <dd className="font-mono text-[var(--muted)]">
            {formatStoryTime(story.updatedAt)}
          </dd>
        </div>
      </dl>

      <section className="mt-8 space-y-6">
        <div>
          <h2 className="desk-kicker mb-2 text-[var(--foreground)]">
            What happened
          </h2>
          <p className="text-[15px] leading-relaxed text-[var(--foreground)]">
            {story.whatHappened}
          </p>
        </div>
        <div>
          <h2 className="desk-kicker mb-2 text-[var(--foreground)]">
            Why it matters
          </h2>
          <p className="text-[15px] leading-relaxed text-[var(--muted)]">
            {story.whyItMatters}
          </p>
        </div>
        {story.coverageAngle && (
          <div className="border-l-2 border-[var(--border)] pl-4">
            <h2 className="desk-kicker mb-2">Coverage angle</h2>
            <p className="text-[14px] leading-relaxed text-[var(--muted)]">
              {story.coverageAngle}
            </p>
          </div>
        )}
      </section>

      <section className="mt-8 border-t border-[var(--border-subtle)] pt-6">
        <h2 className="desk-kicker mb-3 text-[var(--foreground)]">
          Read the underlying sources
        </h2>
        <ul className="space-y-2 text-sm">
          {story.sources.map((sourceName, index) => {
            const url = linksAreAligned ? sourceUrls[index] : undefined;
            return (
              <li key={`${sourceName}-${index}`}>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--accent)] hover:underline"
                  >
                    {sourceName} ↗
                  </a>
                ) : (
                  <span className="text-[var(--muted)]">{sourceName}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {story.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {story.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-sm bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="mt-10 border-t border-[var(--border-subtle)] pt-6 text-[13px] leading-relaxed text-[var(--muted-light)]">
        Fact Desk briefings are original summaries built from attributed source
        evidence. Reported claims remain attributed, and overlapping coverage
        is not treated as automatic confirmation. Publisher RSS descriptions
        are used only as private research input and are not republished unless
        a reviewed syndication licence expressly permits it. Priority measures
        urgency, not certainty.
      </p>
    </article>
  );
}
