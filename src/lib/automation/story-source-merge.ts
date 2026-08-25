import type { StorySource, StorySourceInput } from "@/types/editorial";

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

function sourceToInput(source: StorySource): StorySourceInput {
  return {
    sourceId: source.sourceId,
    sourceName: source.sourceName,
    url: source.url,
    title: source.title,
    feedItemId: source.feedItemId,
    publishedAt: source.publishedAt,
  };
}

/**
 * Merge newly observed source attachments into the evidence already attached
 * to a story. Existing evidence is retained; a newly observed copy of the
 * same URL wins so fresher feed-item metadata can be preserved.
 */
export function mergeStorySources(
  existing: StorySource[],
  incoming: StorySourceInput[],
): StorySourceInput[] {
  const merged = new Map<string, StorySourceInput>();

  for (const source of existing) {
    merged.set(normalizeUrl(source.url), sourceToInput(source));
  }

  for (const source of incoming) {
    const key = normalizeUrl(source.url);
    if (!key) continue;

    const prior = merged.get(key);
    merged.set(key, {
      ...prior,
      ...source,
      sourceName: source.sourceName || prior?.sourceName || "Unknown source",
      url: source.url,
      title: source.title || prior?.title || source.url,
      feedItemId: source.feedItemId ?? prior?.feedItemId ?? null,
      publishedAt: source.publishedAt ?? prior?.publishedAt ?? null,
    });
  }

  return [...merged.values()];
}
