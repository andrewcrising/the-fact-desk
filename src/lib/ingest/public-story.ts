import { attributionSafeBriefing } from "@/lib/ingest/editorial-safety";
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

/**
 * Final public serialization boundary for live stories.
 *
 * Third-party feed text is bounded before browser/API delivery. Reputation-
 * sensitive accusations, allegations and investigations are forced through an
 * attribution-aware guard so the desk does not silently convert a publisher's
 * claim into an independently asserted Fact Desk fact.
 */
export function sanitizeStoryForPublic(story: Story): Story {
  const boundedSummary = boundPublicText(
    story.summary || story.title,
    MAX_PUBLIC_SUMMARY_CHARS,
  );
  const protectedBriefing = attributionSafeBriefing(story, boundedSummary);
  const category = inferStoryCategory(protectedBriefing.title, story.category);
  const baseWhyItMatters = buildFastWhyItMatters(
    protectedBriefing.title,
    protectedBriefing.summary,
    category,
  );
  const multiSource = story.sources.length >= 2;
  const whatHappened = `${protectedBriefing.whatHappenedPrefix} Short source context: ${protectedBriefing.summary}`;
  const corroborationNote = multiSource
    ? ` Related coverage spans ${story.sources.length} publishers; that adds context but does not independently establish every source-specific claim.`
    : "";
  const safetyNote = protectedBriefing.safetyNote
    ? ` ${protectedBriefing.safetyNote}`
    : "";

  return {
    ...story,
    title: protectedBriefing.title,
    summary: protectedBriefing.summary,
    whatHappened: boundPublicText(
      whatHappened,
      MAX_PUBLIC_WHAT_HAPPENED_CHARS,
    ),
    whyItMatters: `${baseWhyItMatters}${corroborationNote}${safetyNote}`,
    category,
    tags: protectedBriefing.sensitive
      ? Array.from(new Set([...story.tags, "reputation-sensitive"]))
      : story.tags,
    coverageAngle: protectedBriefing.sensitive
      ? "Source note: this briefing concerns an allegation, accusation, legal claim, or investigation. Fact Desk preserves attribution and does not treat source-specific accusations as established facts merely because they are repeated. Follow the source links for the original reporting and record."
      : multiSource
        ? `Source note: related reporting is grouped across ${story.sources.length} publishers. The public synopsis is bounded source-feed context; source-specific claims remain attributed to the linked publishers.`
        : "Source note: the public synopsis is short source-feed context. Fact Desk adds separate significance context from the visible headline, category, and synopsis. Follow the source link for the original reporting.",
  };
}
