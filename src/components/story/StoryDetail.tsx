import { ConfidenceLabel } from "@/components/ui/ConfidenceLabel";
import { EvidenceLabel } from "@/components/ui/EvidenceLabel";
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
        <EvidenceLabel evidenceLevel={story.evidenceLevel} />
        <SignalLabel signal={story.signal} />
        <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-light)]">
          {story.category}
        </span>
      </div>

      <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-4xl">
        {story.title}
      </h1>

      <p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">
        {story.summary}
      </p>

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
        <div className="border-l-2 border-[var(--border)] pl-4">
          <h2 className="desk-kicker mb-2">Evidence / sourcing</h2>
          <p className="text-[14px] leading-relaxed text-[var(--muted)]">
            Evidence level: {story.evidenceLevel ?? "Moderate"}. Source spread:
            {" "}
            {formatSourceSpread(story.sources)}.
          </p>
          {story.sourceUrls && story.sourceUrls.length > 0 && (
            <ul className="mt-2 space-y-1 text-[13px]">
              {story.sourceUrls.map((url, index) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    {story.sources[index] ?? `Source ${index + 1}`}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {story.uncertaintyNote && (
          <div>
            <h2 className="desk-kicker mb-2 text-[var(--foreground)]">
              What is still uncertain
            </h2>
            <p className="text-[15px] leading-relaxed text-[var(--muted)]">
              {story.uncertaintyNote}
            </p>
          </div>
        )}
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
        Briefing labels are editorial signals, not verdicts. Draft and raw feed
        items stay private until promoted and published.
      </p>
    </article>
  );
}
