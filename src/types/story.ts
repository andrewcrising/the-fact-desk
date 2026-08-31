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

export interface Story {
  id: string;
  slug: string;
  title: string;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  category: StoryCategory;
  confidence: Confidence;
  signal: Signal;
  sources: string[];
  sourceUrls?: string[];
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  /** Publisher whose headline is displayed as attributed discovery metadata. */
  headlineSource?: string;
  /** How the public synopsis was produced; used for reader-facing provenance. */
  briefingBasis?:
    | "source-headline"
    | "multi-source-headlines"
    | "evidence-synthesis"
    | "editorial";
  /** Audit metadata for an independently generated, source-checked briefing. */
  synthesis?: {
    status: "verified";
    model: string;
    generatedAt: string;
    generationId?: string;
    sourceFingerprint: string;
    sourceCount: number;
    claimCount: number;
  };
  /** Neutral descriptor of how outlets are framing coverage — not partisan branding. */
  coverageAngle?: string;
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
