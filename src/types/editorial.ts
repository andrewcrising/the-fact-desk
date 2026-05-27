import type {
  Confidence,
  EvidenceLevel,
  Signal,
  Story,
  StoryCategory,
} from "@/types/story";

export type SourceType =
  | "rss"
  | "news"
  | "official"
  | "government"
  | "academic"
  | "primary-document"
  | "regulator"
  | "court"
  | "company"
  | "expert-analysis"
  | "social"
  | "unknown"
  | "manual"
  | "api"
  | "wire"
  | "other";

export type FeedItemStatus = "new" | "reviewed" | "promoted" | "ignored" | "error";

export type StoryStatus = "draft" | "published" | "archived" | "corrected";

export type EditorialSelectionStatus = "draft_created" | "attached" | "ignored";

export interface SourceRecord {
  id: string;
  name: string;
  homepageUrl: string | null;
  feedUrl: string | null;
  sourceType: SourceType;
  credibilityScore: number | null;
  politicalOrEditorialLabel: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedItem {
  id: string;
  sourceId: string;
  sourceName?: string;
  title: string;
  url: string;
  canonicalUrl: string;
  author: string | null;
  publishedAt: string | null;
  summary: string | null;
  rawPayload: Record<string, unknown> | null;
  status: FeedItemStatus;
  dedupeKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorySource {
  id: string;
  storyId: string;
  sourceId: string;
  feedItemId: string | null;
  url: string;
  title: string;
  sourceName: string;
  publishedAt: string | null;
  createdAt: string;
}

export interface PersistedStory extends Story {
  status: StoryStatus;
  homepageRank: number | null;
  isLead: boolean;
  storySources: StorySource[];
  createdAt: string;
}

export interface StoryInput {
  slug?: string;
  title: string;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  coverageAngle?: string | null;
  uncertaintyNote?: string | null;
  category: StoryCategory;
  signal: Signal;
  confidence: Confidence;
  evidenceLevel?: EvidenceLevel;
  status?: StoryStatus;
  homepageRank?: number | null;
  isLead?: boolean;
  tags?: string[];
  sourceAttachments?: StorySourceInput[];
}

export interface StoryUpdateInput extends Partial<StoryInput> {
  sourceAttachments?: StorySourceInput[];
}

export interface StorySourceInput {
  sourceId?: string;
  sourceName: string;
  url: string;
  title?: string;
  feedItemId?: string | null;
  publishedAt?: string | null;
}

export interface StoryQuery {
  status?: StoryStatus | "all";
  category?: StoryCategory;
  signal?: Signal;
  search?: string;
  limit?: number;
}

export interface FeedItemQuery {
  status?: FeedItemStatus | "all";
  source?: string;
  search?: string;
  limit?: number;
}

export interface IngestSummary {
  feedsChecked: number;
  itemsFound: number;
  newItemsInserted: number;
  duplicatesSkipped: number;
  errors: Array<{ feedUrl: string; message: string }>;
}
