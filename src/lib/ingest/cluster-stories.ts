import { storyPriorityScore } from "@/lib/stories";
import type { Story, StoryCategory } from "@/types/story";

const STOP_WORDS = new Set([
  "about", "after", "again", "against", "amid", "and", "are", "but", "for",
  "from", "has", "have", "into", "more", "new", "not", "over", "people", "says", "say", "that",
  "the", "their", "this", "with", "will", "your",
]);

const CLUSTER_WINDOW_MS = 72 * 60 * 60 * 1000;
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_OUTPUT_STORIES = 64;

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalTerm(term: string): string {
  if (term.length > 4 && term.endsWith("ies")) {
    return `${term.slice(0, -3)}y`;
  }
  if (term.length > 4 && term.endsWith("s") && !term.endsWith("ss")) {
    return term.slice(0, -1);
  }
  return term;
}

function titleTerms(title: string): Set<string> {
  return new Set(
    normalizeTitle(title)
      .split(" ")
      .filter((term) => term.length > 3 && !STOP_WORDS.has(term))
      .map(canonicalTerm),
  );
}

function publishedMs(story: Story): number {
  const parsed = Date.parse(story.publishedAt);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function titlesLikelyMatch(a: Story, b: Story): boolean {
  const aUrl = a.sourceUrls?.[0]?.toLowerCase();
  const bUrl = b.sourceUrls?.[0]?.toLowerCase();
  if (aUrl && bUrl && aUrl === bUrl) return true;

  const normalizedA = normalizeTitle(a.title);
  const normalizedB = normalizeTitle(b.title);
  if (normalizedA === normalizedB) return true;

  if (Math.abs(publishedMs(a) - publishedMs(b)) > CLUSTER_WINDOW_MS) {
    return false;
  }

  const aTerms = titleTerms(a.title);
  const bTerms = titleTerms(b.title);
  const shared = Array.from(aTerms).filter((term) => bTerms.has(term)).length;
  const union = new Set([...aTerms, ...bTerms]).size;
  const smaller = Math.min(aTerms.size, bTerms.size);
  const jaccard = union === 0 ? 0 : shared / union;
  const overlap = smaller === 0 ? 0 : shared / smaller;

  return (shared >= 4 && overlap >= 0.65) || (shared >= 3 && jaccard >= 0.6);
}

function categoryFor(cluster: Story[]): StoryCategory {
  const counts = new Map<StoryCategory, number>();
  for (const story of cluster) {
    counts.set(story.category, (counts.get(story.category) ?? 0) + 1);
  }
  return (
    Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    cluster[0]?.category ??
    "World"
  );
}

function newestIso(values: string[]): string {
  return values.sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? new Date().toISOString();
}

function oldestIso(values: string[]): string {
  return values.sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? new Date().toISOString();
}

function mergeCluster(cluster: Story[]): Story {
  const ordered = [...cluster].sort((a, b) => publishedMs(b) - publishedMs(a));
  const representative = ordered.reduce((best, story) =>
    titleTerms(story.title).size > titleTerms(best.title).size ? story : best,
  );

  const sourceLinks = new Map<string, string | undefined>();
  for (const story of ordered) {
    story.sources.forEach((source, index) => {
      if (!sourceLinks.has(source)) {
        sourceLinks.set(source, story.sourceUrls?.[index]);
      }
    });
  }

  const sources = Array.from(sourceLinks.keys());
  const linkedUrls = sources.map((source) => sourceLinks.get(source));
  const linksAreComplete = linkedUrls.every((url): url is string => Boolean(url));
  const bestSummary = ordered.reduce((best, story) =>
    story.summary.length > best.summary.length ? story : best,
  );
  const multiSource = sources.length >= 2;

  return {
    ...representative,
    summary: bestSummary.summary,
    whatHappened: bestSummary.whatHappened,
    whyItMatters: multiSource
      ? "Multiple publishers are reporting overlapping versions of this development. Compare the linked coverage for wording, emphasis, and unresolved differences."
      : representative.whyItMatters,
    category: categoryFor(cluster),
    confidence: multiSource ? "Developing" : "Single-source",
    signal: multiSource ? "Cross-angle" : representative.signal,
    sources,
    sourceUrls: linksAreComplete ? linkedUrls : representative.sourceUrls,
    publishedAt: oldestIso(ordered.map((story) => story.publishedAt)),
    updatedAt: newestIso(ordered.map((story) => story.updatedAt)),
    tags: Array.from(new Set(ordered.flatMap((story) => story.tags))),
    coverageAngle: multiSource
      ? `Related reporting clustered across ${sources.length} publishers; source claims still require editorial review.`
      : representative.coverageAngle,
  };
}

function balanceStories(stories: Story[]): Story[] {
  const sorted = [...stories].sort((a, b) => {
    const priorityDelta = storyPriorityScore(b) - storyPriorityScore(a);
    if (priorityDelta !== 0) return priorityDelta;
    const coverageDelta = Math.min(b.sources.length, 4) - Math.min(a.sources.length, 4);
    if (coverageDelta !== 0) return coverageDelta;
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });

  const selected: Story[] = [];
  const categoryCounts = new Map<StoryCategory, number>();
  const singleSourceCounts = new Map<string, number>();
  const categoryCap = 12;
  const singleSourceCap = 8;

  for (const story of sorted) {
    if ((categoryCounts.get(story.category) ?? 0) >= categoryCap) continue;

    if (story.sources.length === 1) {
      const source = story.sources[0] ?? "Unknown";
      if ((singleSourceCounts.get(source) ?? 0) >= singleSourceCap) continue;
      singleSourceCounts.set(source, (singleSourceCounts.get(source) ?? 0) + 1);
    }

    selected.push(story);
    categoryCounts.set(
      story.category,
      (categoryCounts.get(story.category) ?? 0) + 1,
    );
    if (selected.length >= MAX_OUTPUT_STORIES) break;
  }

  return selected;
}

/**
 * Conservative deterministic clustering for the personal live proof.
 * It favors duplicate stories over incorrectly combining distinct events.
 */
export function clusterAndBalanceStories(stories: Story[]): Story[] {
  const cutoff = Date.now() - MAX_AGE_MS;
  const recent = stories
    .filter((story) => publishedMs(story) === 0 || publishedMs(story) >= cutoff)
    .sort((a, b) => publishedMs(b) - publishedMs(a));

  const clusters: Story[][] = [];
  for (const story of recent) {
    const match = clusters.find((cluster) => {
      const representative = cluster[0];
      return representative ? titlesLikelyMatch(story, representative) : false;
    });
    if (match) match.push(story);
    else clusters.push([story]);
  }

  return balanceStories(clusters.map(mergeCluster));
}
