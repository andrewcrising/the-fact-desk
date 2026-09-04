import type { StoryCategory } from "@/types/story";

export interface ClusterableFeedItem {
  id: string;
  title: string;
  canonicalUrl: string;
  sourceName?: string;
  publishedAt?: string | null;
  summary?: string | null;
  category?: StoryCategory;
}

export interface StoryCluster {
  cluster_id: string;
  representative_title: string;
  feed_item_ids: string[];
  source_count: number;
  unique_domains: string[];
  likely_category: StoryCategory | "Unknown";
  confidence: "low" | "medium" | "high";
}

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "for",
  "with",
  "from",
  "into",
  "after",
  "over",
  "new",
  "says",
  "say",
  "will",
  "amid",
  "about",
  "that",
  "this",
]);

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleTerms(title: string): Set<string> {
  return new Set(
    normalizeTitle(title)
      .split(" ")
      .filter((term) => term.length > 3 && !STOP_WORDS.has(term)),
  );
}

function domainFor(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "unknown";
  }
}

function similarity(a: Set<string>, b: Set<string>): number {
  const intersection = Array.from(a).filter((term) => b.has(term)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

/** Deterministic lexical similarity used both within a run and for draft continuity. */
export function storyTitleSimilarity(a: string, b: string): number {
  return similarity(titleTerms(a), titleTerms(b));
}

/**
 * Conservative cross-run matcher. Exact normalized titles match; otherwise at
 * least two meaningful terms must overlap and the Jaccard score must clear a
 * higher threshold than same-run clustering. This favors duplicate drafts over
 * incorrectly merging distinct stories.
 */
export function storyTitlesLikelySame(
  a: string,
  b: string,
  threshold = 0.6,
): boolean {
  if (normalizeTitle(a) === normalizeTitle(b)) return true;
  const aTerms = titleTerms(a);
  const bTerms = titleTerms(b);
  const sharedTerms = Array.from(aTerms).filter((term) => bTerms.has(term)).length;
  return sharedTerms >= 2 && similarity(aTerms, bTerms) >= threshold;
}

function categoryFor(items: ClusterableFeedItem[]): StoryCategory | "Unknown" {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.category) continue;
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  return (
    Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] as
      | StoryCategory
      | undefined
  ) ?? "Unknown";
}

function clusterConfidence(items: ClusterableFeedItem[]): "low" | "medium" | "high" {
  const domains = new Set(items.map((item) => domainFor(item.canonicalUrl)));
  if (items.length >= 3 && domains.size >= 3) return "high";
  if (items.length >= 2 || domains.size >= 2) return "medium";
  return "low";
}

function clusterIdFor(items: ClusterableFeedItem[]): string {
  const representative = normalizeTitle(items[0]?.title ?? "cluster")
    .split(" ")
    .slice(0, 8)
    .join("-");
  const ids = items.map((item) => item.id).sort().join("-");
  return `${representative || "cluster"}-${Buffer.from(ids).toString("base64url").slice(0, 8)}`;
}

function toCluster(items: ClusterableFeedItem[]): StoryCluster {
  const domains = Array.from(new Set(items.map((item) => domainFor(item.canonicalUrl))));
  return {
    cluster_id: clusterIdFor(items),
    representative_title: items[0]?.title ?? "Untitled cluster",
    feed_item_ids: items.map((item) => item.id),
    source_count: items.length,
    unique_domains: domains,
    likely_category: categoryFor(items),
    confidence: clusterConfidence(items),
  };
}

export function clusterFeedItems(items: ClusterableFeedItem[]): StoryCluster[] {
  const clusters: ClusterableFeedItem[][] = [];
  const termsById = new Map(items.map((item) => [item.id, titleTerms(item.title)]));

  for (const item of items) {
    const canonicalKey = item.canonicalUrl.toLowerCase();
    const itemTerms = termsById.get(item.id) ?? new Set<string>();

    const match = clusters.find((cluster) => {
      const representative = cluster[0];
      if (!representative) return false;
      if (representative.canonicalUrl.toLowerCase() === canonicalKey) return true;
      const representativeTerms = termsById.get(representative.id) ?? new Set<string>();
      return similarity(itemTerms, representativeTerms) >= 0.45;
    });

    if (match) {
      match.push(item);
    } else {
      clusters.push([item]);
    }
  }

  return clusters.map(toCluster);
}

export const storyClusteringTestUtils = {
  normalizeTitle,
  titleTerms,
  similarity,
};
