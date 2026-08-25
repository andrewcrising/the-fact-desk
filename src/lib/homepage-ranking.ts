import { scoreRankableStory } from "@/lib/automation/ranking";
import type { Confidence, EvidenceLevel, Signal } from "@/types/story";

export interface HomepageRankableStory {
  id: string;
  isLead: boolean;
  homepageRank: number | null;
  evidenceLevel?: EvidenceLevel;
  confidence: Confidence;
  signal: Signal;
  storySources: Array<unknown>;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

function automatedScore(story: HomepageRankableStory): number {
  return scoreRankableStory(
    {
      id: story.id,
      evidenceLevel: story.evidenceLevel,
      confidence: story.confidence,
      signal: story.signal,
      sourceCount: story.storySources.length,
      undercoveredIndicator: story.signal === "Under-covered",
      publishedAt: story.publishedAt,
      updatedAt: story.updatedAt,
    },
    {
      evidenceFirst: true,
      underCoveredBoost: true,
      lowOutrageMode: true,
    },
  );
}

/**
 * Public desk ordering rule:
 * 1. explicit editorial lead override
 * 2. explicit editorial homepage rank
 * 3. deterministic evidence-first automated score
 *
 * Human overrides therefore remain authoritative without requiring routine
 * manual ordering for every story.
 */
export function rankHomepageStories<T extends HomepageRankableStory>(stories: T[]): T[] {
  return [...stories].sort((a, b) => {
    if (a.isLead !== b.isLead) return a.isLead ? -1 : 1;

    const aPinned = a.homepageRank !== null;
    const bPinned = b.homepageRank !== null;
    if (aPinned && bPinned && a.homepageRank !== b.homepageRank) {
      return (a.homepageRank ?? 0) - (b.homepageRank ?? 0);
    }
    if (aPinned !== bPinned) return aPinned ? -1 : 1;

    const scoreDelta = automatedScore(b) - automatedScore(a);
    if (scoreDelta !== 0) return scoreDelta;

    return a.id.localeCompare(b.id);
  });
}
