import {
  buildFastWhyItMatters,
  inferStoryCategory,
} from "@/lib/ingest/fast-briefing";
import {
  independentEvidenceSourceCount,
  isSocialOnlyStory,
  socialSourceCount,
} from "@/lib/stories";
import type { Story } from "@/types/story";

export const MAX_PUBLIC_SUMMARY_CHARS = 280;
export const MAX_PUBLIC_WHAT_HAPPENED_CHARS = 480;

/**
 * Bound third-party text before it can enter a browser/API payload.
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

/** Final public serialization boundary for live stories. */
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
  const independentSources = independentEvidenceSourceCount(story);
  const socialSources = socialSourceCount(story);
  const multiSource = independentSources >= 2;
  const socialOnly = isSocialOnlyStory(story);
  const sources = sourceList(story);

  if (socialOnly) {
    return {
      ...story,
      summary,
      category,
      confidence: "Single-source",
      whatHappened: boundPublicText(
        `${sources} surfaced this public social signal. ${story.whatHappened}`,
        MAX_PUBLIC_WHAT_HAPPENED_CHARS,
      ),
      whyItMatters:
        "Social activity can surface developments before broader reporting, but engagement, repetition, and account popularity are not proof. Treat this as a discovery signal until primary records or independent reporting establish the underlying facts.",
      coverageAngle:
        "Social/open-web discovery only. Fact Desk preserves the original post link and does not count this item as independent publisher corroboration or automatic lead evidence.",
    };
  }

  const whatHappened = multiSource
    ? `${sources} carry related coverage of this development. Short source context: ${summary}`
    : `${sources} reports this development. Short source context: ${summary}`;

  return {
    ...story,
    summary,
    whatHappened: boundPublicText(
      whatHappened,
      MAX_PUBLIC_WHAT_HAPPENED_CHARS,
    ),
    whyItMatters: multiSource
      ? `${baseWhyItMatters} Related coverage spans ${independentSources} independent publisher/primary sources${socialSources ? ` plus ${socialSources} social signal${socialSources === 1 ? "" : "s"}` : ""}; that adds context but does not independently confirm every source-specific detail.`
      : baseWhyItMatters,
    category,
    coverageAngle: multiSource
      ? `Related reports are grouped across ${independentSources} independent publisher/primary sources${socialSources ? ` with ${socialSources} additional social signal${socialSources === 1 ? "" : "s"}` : ""}. Social activity is discovery context, not confirmation.`
      : socialSources > 0
        ? `This cluster includes social/open-web activity but fewer than two independent publisher/primary sources. The social material remains attributed and does not raise confidence by itself.`
        : "The synopsis is a bounded source-feed excerpt. Fact Desk significance text is generated only from the visible headline, category, and bounded synopsis.",
  };
}
