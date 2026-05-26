import { ConfidenceLabel } from "@/components/ui/ConfidenceLabel";
import { SignalLabel } from "@/components/ui/SignalLabel";
import { formatSourceSpread, formatStoryTime } from "@/lib/stories";
import type { Story } from "@/types/story";
import Link from "next/link";

interface StoryDetailProps {
  story: Story;
}

export function StoryDetail({ story }: StoryDetailProps) {
  return (
    <article className="mx-auto max-w-3xl">
      <Link
        href="/"
        className="mb-6 inline-flex text-sm font-medium text-[var(--accent)] hover:underline"
      >
        ← Back to desk
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ConfidenceLabel confidence={story.confidence} />
        <SignalLabel signal={story.signal} />
        <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-light)]">
          {story.category}
        </span>
        {story.trendingScore != null && (
          <span className="ml-auto flex items-center gap-1 rounded-sm bg-slate-50 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-slate-600 ring-1 ring-inset ring-slate-200">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-slate-400">
              <path d="M8 2v12M8 2l4 4M8 2L4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Trending {story.trendingScore}
          </span>
        )}
      </div>

      <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-4xl">
        {story.title}
      </h1>

      <p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">
        {story.summary}
      </p>

      {/* Data points grid */}
      {story.dataPoints && story.dataPoints.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 border border-[var(--border-subtle)] bg-slate-50/50 p-4 sm:grid-cols-3">
          {story.dataPoints.map((dp) => (
            <div key={dp.label}>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--muted-light)]">
                {dp.label}
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-[var(--foreground)]">
                {dp.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <dl className="mt-6 grid gap-4 border-y border-[var(--border-subtle)] py-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="desk-kicker mb-1">Sources</dt>
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

      {/* Key facts */}
      {story.keyFacts && story.keyFacts.length > 0 && (
        <section className="mt-8">
          <h2 className="desk-kicker mb-3 text-[var(--foreground)]">
            Verified facts
          </h2>
          <ul className="space-y-2 border-l-2 border-[var(--accent)]/20 pl-4">
            {story.keyFacts.map((fact) => (
              <li key={fact} className="text-[14px] leading-relaxed text-[var(--foreground)]">
                {fact}
              </li>
            ))}
          </ul>
        </section>
      )}

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
            Significance
          </h2>
          <p className="text-[15px] leading-relaxed text-[var(--muted)]">
            {story.whyItMatters}
          </p>
        </div>
      </section>

      {/* Timeline */}
      {story.timeline && story.timeline.length > 0 && (
        <section className="mt-8">
          <h2 className="desk-kicker mb-3 text-[var(--foreground)]">Timeline</h2>
          <div className="border-l-2 border-[var(--border)] pl-4">
            {story.timeline.map((entry) => (
              <div key={`${entry.date}-${entry.event}`} className="relative pb-4 last:pb-0">
                <div className="absolute -left-[1.3rem] top-1 h-2 w-2 rounded-full bg-[var(--accent)]" />
                <p className="font-mono text-[11px] font-medium text-[var(--muted-light)]">
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-[var(--foreground)]">
                  {entry.event}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Key figures */}
      {story.keyFigures && story.keyFigures.length > 0 && (
        <section className="mt-8">
          <h2 className="desk-kicker mb-3 text-[var(--foreground)]">
            Key figures &amp; organizations
          </h2>
          <div className="space-y-2">
            {story.keyFigures.map((figure) => (
              <div key={figure.name} className="flex items-baseline gap-2 text-[14px]">
                <span className="font-medium text-[var(--foreground)]">{figure.name}</span>
                <span className="text-[12px] text-[var(--muted)]">— {figure.role}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Primary documents */}
      {story.primaryDocuments && story.primaryDocuments.length > 0 && (
        <section className="mt-8">
          <h2 className="desk-kicker mb-3 text-[var(--foreground)]">
            Primary documents
          </h2>
          <ul className="space-y-2">
            {story.primaryDocuments.map((doc) => (
              <li key={doc.title} className="flex items-start gap-2 text-[13px]">
                <span className="mt-0.5 shrink-0 rounded-sm bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                  {doc.type}
                </span>
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    {doc.title}
                  </a>
                ) : (
                  <span className="text-[var(--foreground)]">{doc.title}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Coverage angle — presented as neutral media framing note */}
      {story.coverageAngle && (
        <div className="mt-8 border-l-2 border-[var(--border)] pl-4">
          <h2 className="desk-kicker mb-2">Media framing note</h2>
          <p className="text-[14px] leading-relaxed text-[var(--muted)]">
            {story.coverageAngle}
          </p>
        </div>
      )}

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
        This briefing presents verifiable facts from primary sources without
        editorial commentary. Confidence and signal labels are evidence
        indicators — not truth declarations.
      </p>
    </article>
  );
}
