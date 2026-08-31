import type { Story, StoryCategory } from "@/types/story";

export interface HouseBriefing {
  summary: string;
  whatHappened: string;
  coverageAngle: string;
}

function firstSentence(text: string): string {
  const sentence = text.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  return sentence || text.trim();
}

function categoryLabel(category: StoryCategory): string {
  return category === "World" ? "international" : category.toLowerCase();
}

/**
 * Creates public-facing Fact Desk copy without republishing the RSS description.
 *
 * The source headline remains visible as attributed discovery metadata. That
 * preserves the reported claim and its framing instead of silently softening
 * it. Publisher-written descriptions may inform classification and the
 * independent why-it-matters template, but never enter these display fields.
 */
export function buildSingleSourceHouseBriefing({
  sourceName,
  category,
  whyItMatters,
}: {
  sourceName: string;
  category: StoryCategory;
  whyItMatters: string;
}): HouseBriefing {
  const stakes = firstSentence(whyItMatters);

  return {
    summary: `${sourceName} is reporting this ${categoryLabel(category)} development. ${stakes}`,
    whatHappened:
      `${sourceName} is the current reporting basis for the headline above. ` +
      "The Fact Desk is keeping the claim attributed to that publisher until another independent report or a primary record supports it.",
    coverageAngle:
      "Source-reported headline with an independently written Fact Desk briefing. The publisher's RSS description is not republished.",
  };
}

function naturalSourceList(sources: string[]): string {
  if (sources.length <= 1) return sources[0] ?? "the listed source";
  if (sources.length === 2) return `${sources[0]} and ${sources[1]}`;
  return `${sources.slice(0, -1).join(", ")}, and ${sources.at(-1)}`;
}

/** Rebuilds cluster copy from evidence metadata rather than carrying forward a source lede. */
export function buildMultiSourceHouseBriefing({
  representative,
  sources,
}: {
  representative: Story;
  sources: string[];
}): HouseBriefing {
  const stakes = firstSentence(representative.whyItMatters);
  const sourceList = naturalSourceList(sources);

  return {
    summary:
      `Related reporting from ${sources.length} publishers identifies the same core development. ${stakes}`,
    whatHappened:
      `${sourceList} are carrying related reports about the headline above. ` +
      "The desk grouped them by overlapping event terms and timing; shared coverage adds context but does not independently verify every source-specific detail.",
    coverageAngle:
      `Independently written Fact Desk briefing based on related headline metadata from ${sources.length} publishers. Publisher RSS descriptions are not republished.`,
  };
}

/**
 * Fail-closed compatibility layer for caches created before the content
 * firewall existed. It replaces any legacy source-derived synopsis before the
 * story can reach a page or API response.
 */
export function sanitizeLiveStoryForDisplay(story: Story): Story {
  if (story.briefingBasis) return story;

  const headlineSource = story.headlineSource ?? story.sources[0] ?? "Source";
  const briefing =
    story.sources.length >= 2
      ? buildMultiSourceHouseBriefing({ representative: story, sources: story.sources })
      : buildSingleSourceHouseBriefing({
          sourceName: headlineSource,
          category: story.category,
          whyItMatters: story.whyItMatters,
        });

  return {
    ...story,
    summary: briefing.summary,
    whatHappened: briefing.whatHappened,
    coverageAngle: briefing.coverageAngle,
    headlineSource,
    briefingBasis:
      story.sources.length >= 2
        ? "multi-source-headlines"
        : "source-headline",
  };
}
