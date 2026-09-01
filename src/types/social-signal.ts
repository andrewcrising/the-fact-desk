import type { StoryCategory } from "@/types/story";

export type SocialPlatform = "bluesky" | "mastodon" | "x" | "other";

export interface SocialEngagement {
  likes: number;
  reposts: number;
  replies: number;
  quotes?: number;
}

export interface SocialSignalCandidate {
  id: string;
  platform: SocialPlatform;
  account: string;
  displayName?: string;
  text: string;
  url: string;
  createdAt: string;
  engagement: SocialEngagement;
  /** True only when the configured source is known to represent the subject/organization itself. */
  directSource: boolean;
  /** Optional coarse category hint. Public category is still re-inferred later. */
  categoryHint?: StoryCategory;
}

export interface RankedSocialSignal extends SocialSignalCandidate {
  score: number;
  reason: string;
}

export interface SocialSignalDiagnostics {
  signals: RankedSocialSignal[];
  sourcesChecked: number;
  sourcesWithSignals: number;
  failedSourceIds: string[];
  providerCounts: Partial<Record<SocialPlatform, number>>;
  fetchedAt: string;
}
