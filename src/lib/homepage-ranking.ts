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

function automaticSupportTier(story: HomepageRankableStory): number {
  if (story.storySources.length >= 2 && story.confidence !== "Single-source") {
    return 2;
  }
  if (story.storySources.length >= 2) return 1;
  return 0;
}

/**
 * Public desk ordering rule:
 * 1. explicit editorial lead override
 * 2. explicit editorial homepage rank
 * 3. automatic evidence-support tier (multi-source before single-source)
 * 4. deterministic evidence-first automated score
 *
 * Human overrides remain authoritative, but unpinned automation cannot place a
 * normal single-source item above better-supported multi-source reporting just
 * because it is newer or has a stronger editorial-priority label.
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

    const supportDelta = automaticSupportTier(b) - automaticSupportTier(a);
    if (supportDelta !== 0) return supportDelta;

    const scoreDelta = automatedScore(b) - automatedScore(a);
    if (scoreDelta !== 0) return scoreDelta;

    return a.id.localeCompare(b.id);
  });
}
