import type { Confidence, Signal, Story, StoryCategory } from "@/types/story";

export function formatStoryTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatSourceSpread(sources: string[]): string {
  return sources.join(" · ");
}

function normalizedSourceIdentities(story: Story): string[] {
  return story.sources.map((sourceName, index) => {
    const url = story.sourceUrls?.[index];
    if (url) {
      try {
        return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        // Fall through to the publisher name when a source URL is malformed.
      }
    }
    return sourceName.trim().toLowerCase();
  });
}

export function uniqueSourceCount(story: Story): number {
  return new Set(normalizedSourceIdentities(story)).size;
}

const PRIMARY_SOURCE_NAME_PATTERN =
  /\b(white house|department|agency|court|docket|regulator|official|federal reserve|cisa|sec|fda|nasa|nih|cdc|justice department|department of justice)\b/i;

export function isPrimaryBackedStory(story: Story): boolean {
  const hasPrimaryDomain = (story.sourceUrls ?? []).some((url) => {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return (
        hostname.endsWith(".gov") ||
        hostname.endsWith(".mil") ||
        hostname.endsWith(".edu")
      );
    } catch {
      return false;
    }
  });

  return (
    hasPrimaryDomain ||
    story.sources.some((sourceName) => PRIMARY_SOURCE_NAME_PATTERN.test(sourceName))
  );
}

export function isMultiSourceStory(story: Story): boolean {
  return uniqueSourceCount(story) >= 2;
}

/**
 * Automatic lead placement requires more than one distinct publisher/source.
 * A primary-source-only item can be authoritative for what that institution
 * announced, but it is not automatically promoted as the desk's lead story.
 */
export function isAutomaticLeadEligible(story: Story): boolean {
  return isMultiSourceStory(story) && story.confidence !== "Single-source";
}

export function getTopSignalStory(stories: Story[]): Story | undefined {
  return stories.find(
    (story) => story.signal === "Top Signal" && isAutomaticLeadEligible(story),
  );
}

export interface LiveEvidenceBuckets {
  multiSource: Story[];
  primaryOnly: Story[];
  incoming: Story[];
}

function confidenceWeight(confidence: Confidence): number {
  if (confidence === "Confirmed") return 30;
  if (confidence === "Developing") return 15;
  if (confidence === "Disputed") return 5;
  return 0;
}

function liveEvidenceScore(story: Story): number {
  return (
    Math.min(uniqueSourceCount(story), 4) * 10 +
    confidenceWeight(story.confidence) +
    (isPrimaryBackedStory(story) ? 12 : 0)
  );
}

function rankLiveEvidence(stories: Story[]): Story[] {
  return [...stories].sort((a, b) => {
    const scoreDelta = liveEvidenceScore(b) - liveEvidenceScore(a);
    if (scoreDelta !== 0) return scoreDelta;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

/**
 * Keep raw live ingestion visible without implying that every item has equal
 * evidentiary support. Multi-source coverage leads, primary-only updates are
 * separated, and ordinary single-newsroom items remain incoming signals.
 */
export function partitionLiveStoriesByEvidence(
  stories: Story[],
): LiveEvidenceBuckets {
  const multiSource: Story[] = [];
  const primaryOnly: Story[] = [];
  const incoming: Story[] = [];

  for (const story of stories) {
    if (isMultiSourceStory(story)) {
      multiSource.push(story);
    } else if (isPrimaryBackedStory(story)) {
      primaryOnly.push(story);
    } else {
      incoming.push(story);
    }
  }

  return {
    multiSource: rankLiveEvidence(multiSource),
    primaryOnly: rankLiveEvidence(primaryOnly),
    incoming: rankLiveEvidence(incoming),
  };
}

export function filterByCategory(
  stories: Story[],
  category: StoryCategory | null,
): Story[] {
  if (!category) return stories;
  return stories.filter((s) => s.category === category);
}

export function storiesBySignal(stories: Story[], signal: Signal): Story[] {
  return stories.filter((s) => s.signal === signal);
}

export function storiesLowConfidence(stories: Story[]): Story[] {
  return stories.filter(
    (s) =>
      s.confidence === "Developing" ||
      s.confidence === "Single-source" ||
      s.signal === "Developing",
  );
}

export function isLowConfidence(confidence: Confidence): boolean {
  return confidence === "Developing" || confidence === "Single-source";
}

export function categoryCounts(
  stories: Story[],
): Partial<Record<StoryCategory, number>> {
  const counts: Partial<Record<StoryCategory, number>> = {};
  for (const story of stories) {
    counts[story.category] = (counts[story.category] ?? 0) + 1;
  }
  return counts;
}

export function getDeskStats(stories: Story[]) {
  const developingIds = new Set<string>();
  for (const story of storiesLowConfidence(stories)) {
    developingIds.add(story.id);
  }
  const sources = new Set<string>();
  for (const story of stories) {
    for (const source of story.sources) {
      sources.add(source);
    }
  }
  return {
    topSignals: storiesBySignal(stories, "Top Signal").length,
    underCovered: storiesBySignal(stories, "Under-covered").length,
    developing: developingIds.size,
    sourcesTracked: sources.size,
  };
}
