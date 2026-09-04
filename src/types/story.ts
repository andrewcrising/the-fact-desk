/** Confidence = how well-established the core facts are. */
export type Confidence =
  | "Confirmed"
  | "Developing"
  | "Disputed"
  | "Single-source";

/** Signal = editorial priority / coverage pattern (not a truth claim). */
export type Signal =
  | "Top Signal"
  | "Under-covered"
  | "Cross-angle"
  | "Developing";

export type StoryCategory =
  | "Politics"
  | "Markets"
  | "Technology"
  | "World"
  | "Health"
  | "Courts"
  | "Energy"
  | "Culture";

/** Evidence level = how directly the briefing is supported by sources. */
export type EvidenceLevel = "Low" | "Moderate" | "Strong";

/**
 * Evidence source class. Social/open-web items are discovery signals, not
 * equivalent to independent publisher or primary-record corroboration.
 */
export type EvidenceSourceKind =
  | "publisher"
  | "primary"
  | "social"
  | "open-web";

export interface Story {
  id: string;
  slug: string;
  title: string;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  category: StoryCategory;
  confidence: Confidence;
  evidenceLevel?: EvidenceLevel;
  signal: Signal;
  sources: string[];
  sourceUrls?: string[];
  /** Optional array aligned by index with `sources`. Legacy/persisted stories may omit it. */
  sourceKinds?: EvidenceSourceKind[];
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  /** Neutral descriptor of how outlets are framing coverage — not partisan branding. */
  coverageAngle?: string;
  /** What remains unknown, disputed, or not independently confirmed. */
  uncertaintyNote?: string;
}

export interface LiveSignal {
  id: string;
  label: string;
  detail: string;
  time: string;
}

export interface WatchlistSource {
  id: string;
  name: string;
  note: string;
}

export interface CorrectionEntry {
  id: string;
  headline: string;
  correction: string;
  date: string;
}
