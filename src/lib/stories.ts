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

export function getTopSignalStory(stories: Story[]): Story | undefined {
  return stories.find((s) => s.signal === "Top Signal");
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
