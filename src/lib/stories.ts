import type { Confidence, Signal, Story, StoryCategory } from "@/types/story";

export type StoryPriority = "Urgent" | "Major" | "Monitor";

export interface StoryPriorityBuckets {
  urgent: Story[];
  major: Story[];
  monitor: Story[];
}

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

const URGENT_IMPACT_PATTERN =
  /\b(nuclear|war|invasion|airstrike|air strike|missile|rocket attack|military attack|mass shooting|assassination|coup|earthquake|hurricane|tornado|flash flood|wildfire|explosion|evacuat(?:e|ed|ion)|missing|killed|dead|deaths?|ceasefire|supreme court|election results?)\b/i;

const MAJOR_IMPACT_PATTERN =
  /\b(strike|sanctions?|interest rates?|rate hike|rate cut|inflation|jobs report|unemployment|fda approves?|recall|outbreak|pandemic|cyberattack|data breach|zero-day|merger|acquisition|bank failure|default|shutdown|indictment|conviction|ruling|tariffs?)\b/i;

function recencyScore(story: Story): number {
  const timestamp = Date.parse(story.updatedAt || story.publishedAt);
  if (Number.isNaN(timestamp)) return 0;
  const ageMinutes = Math.max(0, (Date.now() - timestamp) / 60_000);
  if (ageMinutes <= 30) return 30;
  if (ageMinutes <= 90) return 24;
  if (ageMinutes <= 180) return 18;
  if (ageMinutes <= 360) return 12;
  if (ageMinutes <= 720) return 8;
  if (ageMinutes <= 1_440) return 4;
  return 0;
}

function impactScore(story: Story): number {
  const text = `${story.title} ${story.summary} ${story.whatHappened}`;
  if (URGENT_IMPACT_PATTERN.test(text)) return 40;
  if (MAJOR_IMPACT_PATTERN.test(text)) return 22;
  return 0;
}

function categoryImpactScore(category: StoryCategory): number {
  if (category === "World" || category === "Politics" || category === "Markets") {
    return 6;
  }
  if (category === "Health" || category === "Courts" || category === "Energy") {
    return 4;
  }
  if (category === "Technology") return 2;
  return 0;
}

/**
 * Editorial urgency score, not a truth score. It deliberately balances public
 * impact and recency with evidence depth so a major breaking event can surface
 * immediately while still carrying its confidence/source warnings.
 */
export function storyPriorityScore(story: Story): number {
  const evidence = Math.min(uniqueSourceCount(story), 4) * 7;
  const confidence =
    story.confidence === "Confirmed"
      ? 8
      : story.confidence === "Developing"
        ? 4
        : story.confidence === "Disputed"
          ? 1
          : 0;

  return (
    impactScore(story) +
    recencyScore(story) +
    evidence +
    confidence +
    categoryImpactScore(story.category) +
    (isPrimaryBackedStory(story) ? 10 : 0) +
    (story.signal === "Cross-angle" ? 4 : 0) +
    (story.signal === "Under-covered" ? 2 : 0)
  );
}

export function getStoryPriority(story: Story): StoryPriority {
  const score = storyPriorityScore(story);
  if (score >= 70) return "Urgent";
  if (score >= 45) return "Major";
  return "Monitor";
}

export function rankStoriesByPriority(stories: Story[]): Story[] {
  return [...stories].sort((a, b) => {
    const priorityDelta = storyPriorityScore(b) - storyPriorityScore(a);
    if (priorityDelta !== 0) return priorityDelta;
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
}

export function partitionStoriesByPriority(stories: Story[]): StoryPriorityBuckets {
  const urgent: Story[] = [];
  const major: Story[] = [];
  const monitor: Story[] = [];

  for (const story of rankStoriesByPriority(stories)) {
    const priority = getStoryPriority(story);
    if (priority === "Urgent") urgent.push(story);
    else if (priority === "Major") major.push(story);
    else monitor.push(story);
  }

  return { urgent, major, monitor };
}

export function getHighestPriorityStory(stories: Story[]): Story | undefined {
  return rankStoriesByPriority(stories)[0];
}

function rankLiveEvidence(stories: Story[]): Story[] {
  return [...stories].sort((a, b) => {
    const scoreDelta = liveEvidenceScore(b) - liveEvidenceScore(a);
    if (scoreDelta !== 0) return scoreDelta;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

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
    topSignals: partitionStoriesByPriority(stories).urgent.length,
    underCovered: storiesBySignal(stories, "Under-covered").length,
    developing: developingIds.size,
    sourcesTracked: sources.size,
  };
}
