import type { EvidenceLevel, Confidence, Signal } from "@/types/story";

export interface RankingPreferences {
  evidenceFirst?: boolean;
  underCoveredBoost?: boolean;
  breakingBoost?: boolean;
  officialSourceHeavy?: boolean;
  lowOutrageMode?: boolean;
}

export interface RankableStory {
  id: string;
  evidenceLevel?: EvidenceLevel;
  confidence: Confidence;
  signal: Signal;
  sourceCount: number;
  undercoveredIndicator?: boolean;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

function evidenceScore(level?: EvidenceLevel): number {
  if (level === "Strong") return 35;
  if (level === "Moderate") return 22;
  return 8;
}

function confidenceScore(confidence: Confidence): number {
  if (confidence === "Confirmed") return 25;
  if (confidence === "Developing") return 15;
  if (confidence === "Disputed") return 6;
  return 4;
}

function signalScore(signal: Signal): number {
  if (signal === "Top Signal") return 20;
  if (signal === "Under-covered") return 18;
  if (signal === "Cross-angle") return 14;
  return 8;
}

function recencyScore(value?: string | null): number {
  if (!value) return 0;
  const ageHours = (Date.now() - new Date(value).getTime()) / 3_600_000;
  if (!Number.isFinite(ageHours) || ageHours < 0) return 8;
  if (ageHours <= 12) return 10;
  if (ageHours <= 48) return 7;
  if (ageHours <= 168) return 4;
  return 1;
}

export function scoreRankableStory(
  story: RankableStory,
  preferences: RankingPreferences = {},
): number {
  let score =
    evidenceScore(story.evidenceLevel) +
    confidenceScore(story.confidence) +
    signalScore(story.signal) +
    Math.min(story.sourceCount * 4, 16) +
    recencyScore(story.updatedAt ?? story.publishedAt);

  if (story.undercoveredIndicator && preferences.underCoveredBoost !== false) {
    score += 12;
  }
  if (preferences.breakingBoost && story.signal === "Developing") {
    score += 6;
  }
  if (preferences.officialSourceHeavy && story.evidenceLevel === "Strong") {
    score += 8;
  }
  if (preferences.lowOutrageMode && story.confidence === "Disputed") {
    score -= 6;
  }

  return score;
}

export function rankStories<T extends RankableStory>(
  stories: T[],
  preferences: RankingPreferences = {},
): T[] {
  return [...stories].sort(
    (a, b) =>
      scoreRankableStory(b, preferences) - scoreRankableStory(a, preferences),
  );
}
