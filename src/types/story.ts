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

export interface TimelineEvent {
  date: string;
  event: string;
}

export interface KeyFigure {
  name: string;
  role: string;
}

export interface DataPoint {
  label: string;
  value: string;
}

export interface PrimaryDocument {
  title: string;
  url?: string;
  type: "report" | "filing" | "statement" | "study" | "advisory" | "ruling" | "data" | "other";
}

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
  /** Neutral descriptor of how outlets are framing coverage — not partisan branding. */
  coverageAngle?: string;
  /** Simulated popularity metric — higher = more searched/viewed. */
  trendingScore?: number;
  /** Bullet-point verifiable facts, free of editorial framing. */
  keyFacts?: string[];
  /** Chronological record of events. */
  timeline?: TimelineEvent[];
  /** People, agencies, or organizations central to this story. */
  keyFigures?: KeyFigure[];
  /** Quantitative data points cited in primary sources. */
  dataPoints?: DataPoint[];
  /** Links to original documents, filings, studies, or data sets. */
  primaryDocuments?: PrimaryDocument[];
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
