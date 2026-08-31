import {
  buildFastWhyItMatters,
  inferStoryCategory,
} from "@/lib/ingest/fast-briefing";
import type { Story } from "@/types/story";

export const MAX_PUBLIC_SUMMARY_CHARS = 280;
export const MAX_PUBLIC_WHAT_HAPPENED_CHARS = 480;

/**
 * Bound third-party feed text before it can enter a browser/API payload.
 * Prefer a natural word/sentence boundary without ever exceeding maxChars.
 */
export function boundPublicText(text: string, maxChars: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;

  const room = Math.max(1, maxChars - 1);
  const candidate = clean.slice(0, room);
  const sentenceBoundary = Math.max(
    candidate.lastIndexOf(". "),
    candidate.lastIndexOf("! "),
    candidate.lastIndexOf("? "),
  );
  const wordBoundary = candidate.lastIndexOf(" ");
  const preferredBoundary =
    sentenceBoundary >= Math.floor(room * 0.55)
      ? sentenceBoundary + 1
      : wordBoundary >= Math.floor(room * 0.7)
        ? wordBoundary
        : room;

  return `${candidate.slice(0, preferredBoundary).trimEnd()}…`;
}

function sourceList(story: Story): string {
  if (story.sources.length === 0) return "The linked source";
  if (story.sources.length === 1) return story.sources[0] ?? "The linked source";
  if (story.sources.length === 2) return `${story.sources[0]} and ${story.sources[1]}`;
  return `${story.sources.slice(0, 2).join(", ")} and ${story.sources.length - 2} more sources`;
}

/**
 * Final public serialization boundary for live stories.
 *
 * The useful tile synopsis is preserved as a short attributed RSS excerpt, but
 * article-length feed bodies are discarded. Public category/significance copy
 * is then recomputed from the visible headline + bounded synopsis so hidden
 * publisher prose cannot create unsupported significance claims.
 */
export function sanitizeStoryForPublic(story: Story): Story {
  const summary = boundPublicText(
    story.summary || story.title,
    MAX_PUBLIC_SUMMARY_CHARS,
  );
  const category = inferStoryCategory(story.title, story.category);
  const baseWhyItMatters = buildFastWhyItMatters(
    story.title,
    summary,
    category,
  );
  const multiSource = story.sources.length >= 2;
  const sources = sourceList(story);
  const whatHappened = multiSource
    ? `${sources} carry related coverage of this development. Short feed context: ${summary}`
    : `${sources} reports this development. Short feed context: ${summary}`;

  return {
    ...story,
    summary,
    whatHappened: boundPublicText(
      whatHappened,
      MAX_PUBLIC_WHAT_HAPPENED_CHARS,
    ),
    whyItMatters: multiSource
      ? `${baseWhyItMatters} Related coverage spans ${story.sources.length} publishers; that adds context but does not independently confirm every source-specific detail.`
      : baseWhyItMatters,
    category,
    coverageAngle: multiSource
      ? `Related reports are grouped across ${story.sources.length} publishers. The synopsis is a bounded feed excerpt; source-specific claims remain attributed to the linked publishers.`
      : "The synopsis is a bounded RSS excerpt from the linked source. Fact Desk significance text is generated only from the visible headline, category, and bounded synopsis.",
  };
}
