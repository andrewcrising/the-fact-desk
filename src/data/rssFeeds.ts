import type { SourceType } from "@/types/editorial";
import type { Signal, StoryCategory } from "@/types/story";

export interface RssFeedConfig {
  id: string;
  sourceName: string;
  homepageUrl: string;
  feedUrl: string;
  category: StoryCategory;
  signal: Signal;
  sourceType: SourceType;
  editorialLabel: string;
  credibilityScore?: number | null;
  enabled: boolean;
}

/**
 * Public RSS/Atom feeds that require no API keys.
 *
 * Source metadata is descriptive rather than ideological scoring. Official and
 * primary-source feeds are identified explicitly so evidence ranking can treat
 * them differently from secondary reporting without pretending a single
 * numeric credibility score is objective.
 */
export const RSS_FEEDS: RssFeedConfig[] = [
  {
    id: "npr-news",
    sourceName: "NPR",
    homepageUrl: "https://www.npr.org",
    feedUrl: "https://feeds.npr.org/1001/rss.xml",
    category: "World",
    signal: "Developing",
    sourceType: "news",
    editorialLabel: "public-media",
    enabled: true,
  },
  {
    id: "bbc-world",
    sourceName: "BBC World",
    homepageUrl: "https://www.bbc.com/news/world",
    feedUrl: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "World",
    signal: "Developing",
    sourceType: "news",
    editorialLabel: "international-public-service",
    enabled: true,
  },
  {
    id: "bbc-news",
    sourceName: "BBC News",
    homepageUrl: "https://www.bbc.com/news",
    feedUrl: "https://feeds.bbci.co.uk/news/rss.xml",
    category: "World",
    signal: "Developing",
    sourceType: "news",
    editorialLabel: "international-public-service",
    enabled: true,
  },
  {
    id: "cisa-advisories",
    sourceName: "CISA",
    homepageUrl: "https://www.cisa.gov",
    feedUrl: "https://www.cisa.gov/cybersecurity-advisories/all.xml",
    category: "Technology",
    signal: "Developing",
    sourceType: "government",
    editorialLabel: "official-primary",
    enabled: true,
  },
  {
    id: "federal-reserve-press",
    sourceName: "Federal Reserve",
    homepageUrl: "https://www.federalreserve.gov",
    feedUrl: "https://www.federalreserve.gov/feeds/press_all.xml",
    category: "Markets",
    signal: "Developing",
    sourceType: "regulator",
    editorialLabel: "official-primary",
    enabled: true,
  },
  {
    id: "sec-press-releases",
    sourceName: "SEC",
    homepageUrl: "https://www.sec.gov",
    feedUrl: "https://www.sec.gov/news/pressreleases.rss",
    category: "Markets",
    signal: "Developing",
    sourceType: "regulator",
    editorialLabel: "official-primary",
    enabled: true,
  },
  {
    id: "nasa-news-releases",
    sourceName: "NASA",
    homepageUrl: "https://www.nasa.gov",
    feedUrl: "https://www.nasa.gov/news-release/feed/",
    category: "Technology",
    signal: "Developing",
    sourceType: "government",
    editorialLabel: "official-primary",
    enabled: true,
  },
  {
    id: "who-news",
    sourceName: "WHO",
    homepageUrl: "https://www.who.int",
    feedUrl: "https://www.who.int/rss-feeds/news-english.xml",
    category: "Health",
    signal: "Developing",
    sourceType: "official",
    editorialLabel: "international-official",
    enabled: true,
  },
  {
    id: "nih-news-releases",
    sourceName: "NIH",
    homepageUrl: "https://www.nih.gov",
    feedUrl: "https://www.nih.gov/news-releases/feed.xml",
    category: "Health",
    signal: "Developing",
    sourceType: "government",
    editorialLabel: "official-primary",
    enabled: true,
  },
];

export function getEnabledFeeds(): RssFeedConfig[] {
  return RSS_FEEDS.filter((feed) => feed.enabled);
}
