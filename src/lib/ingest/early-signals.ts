import { isSocialOnlyStory } from "@/lib/stories";
import type { Story } from "@/types/story";

const MAX_EARLY_SIGNAL_AGE_MS = 3 * 60 * 60 * 1000;
const GENERIC_TERMS = new Set([
  "social", "signal", "breaking", "news", "report", "reported", "reports",
  "developing", "update", "updates", "after", "amid", "about", "from", "with",
  "that", "this", "their", "into", "over", "under", "more", "latest",
]);

function normalizedTerms(text: string): Set<string> {
  const terms = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .split(/[^a-z0-9]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 4 && !GENERIC_TERMS.has(term));
  return new Set(terms);
}

function normalizedUrls(story: Story): Set<string> {
  return new Set(
    (story.sourceUrls ?? []).map((value) => {
      try {
        const url = new URL(value);
        url.hash = "";
        url.search = "";
        return url.toString().replace(/\/$/, "");
      } catch {
        return value.trim();
      }
    }).filter(Boolean),
  );
}

export function storiesRepresentSameEvent(a: Story, b: Story): boolean {
  const aUrls = normalizedUrls(a);
  for (const url of normalizedUrls(b)) if (aUrls.has(url)) return true;

  const aTerms = normalizedTerms(`${a.title} ${a.summary}`);
  const bTerms = normalizedTerms(`${b.title} ${b.summary}`);
  if (aTerms.size === 0 || bTerms.size === 0) return false;

  let shared = 0;
  for (const term of aTerms) if (bTerms.has(term)) shared += 1;
  if (shared < 3) return false;

  const union = new Set([...aTerms, ...bTerms]).size;
  return shared / union >= 0.42 || shared / Math.min(aTerms.size, bTerms.size) >= 0.6;
}

function signalRank(story: Story, nowMs: number): number {
  const timestamp = Date.parse(story.updatedAt || story.publishedAt);
  const ageMinutes = Number.isFinite(timestamp)
    ? Math.max(0, (nowMs - timestamp) / 60_000)
    : Number.POSITIVE_INFINITY;
  const freshness = Math.max(0, 180 - ageMinutes);
  const xBonus = story.tags.includes("social:x") ? 35 : 0;
  const directBonus = story.tags.includes("social-direct-source") ? 20 : 0;
  return freshness + xBonus + directBonus;
}

export function selectNovelEarlySignals(
  stories: Story[],
  excludedStories: Story[] = [],
  nowMs = Date.now(),
  limit = 8,
): Story[] {
  const candidates = stories
    .filter((story) => {
      if (!isSocialOnlyStory(story)) return false;
      const timestamp = Date.parse(story.updatedAt || story.publishedAt);
      if (!Number.isFinite(timestamp)) return false;
      const age = nowMs - timestamp;
      return age >= -5 * 60_000 && age <= MAX_EARLY_SIGNAL_AGE_MS;
    })
    .filter(
      (story) => !excludedStories.some((excluded) => storiesRepresentSameEvent(story, excluded)),
    )
    .sort((a, b) => signalRank(b, nowMs) - signalRank(a, nowMs));

  const selected: Story[] = [];
  for (const candidate of candidates) {
    if (selected.some((story) => storiesRepresentSameEvent(candidate, story))) continue;
    selected.push(candidate);
    if (selected.length >= limit) break;
  }
  return selected;
}
