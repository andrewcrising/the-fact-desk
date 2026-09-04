import type { Signal, StoryCategory } from "@/types/story";

const STORY_CATEGORIES = new Set<StoryCategory>([
  "Politics",
  "Markets",
  "Technology",
  "World",
  "Health",
  "Courts",
  "Energy",
  "Culture",
]);

const SIGNALS = new Set<Signal>([
  "Top Signal",
  "Under-covered",
  "Cross-angle",
  "Developing",
]);

interface FactDeskFeedMetadata {
  feedId?: string;
  category?: StoryCategory;
  signal?: Signal;
}

export function withFactDeskFeedMetadata(
  rawPayload: Record<string, unknown> | null | undefined,
  metadata: FactDeskFeedMetadata,
): Record<string, unknown> {
  return {
    ...(rawPayload ?? {}),
    factDesk: {
      feedId: metadata.feedId,
      category: metadata.category,
      signal: metadata.signal,
    },
  };
}

export function readFactDeskFeedMetadata(
  rawPayload: Record<string, unknown> | null | undefined,
): FactDeskFeedMetadata {
  const candidate = rawPayload?.factDesk;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return {};
  }

  const value = candidate as Record<string, unknown>;
  const category =
    typeof value.category === "string" &&
    STORY_CATEGORIES.has(value.category as StoryCategory)
      ? (value.category as StoryCategory)
      : undefined;
  const signal =
    typeof value.signal === "string" && SIGNALS.has(value.signal as Signal)
      ? (value.signal as Signal)
      : undefined;

  return {
    feedId: typeof value.feedId === "string" ? value.feedId : undefined,
    category,
    signal,
  };
}
