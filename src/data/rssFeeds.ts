import type { Signal, StoryCategory } from "@/types/story";

export interface RssFeedConfig {
  id: string;
  sourceName: string;
  feedUrl: string;
  category: StoryCategory;
  signal: Signal;
  enabled: boolean;
}

/**
 * Stable public RSS feeds (no API keys). Disable feeds that fail in your environment.
 * Later: load from DB or env in production cron jobs.
 */
export const RSS_FEEDS: RssFeedConfig[] = [
  {
    id: "npr-news",
    sourceName: "NPR",
    feedUrl: "https://feeds.npr.org/1001/rss.xml",
    category: "World",
    signal: "Developing",
    enabled: true,
  },
  {
    id: "bbc-world",
    sourceName: "BBC World",
    feedUrl: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "World",
    signal: "Developing",
    enabled: true,
  },
  {
    id: "bbc-news",
    sourceName: "BBC News",
    feedUrl: "https://feeds.bbci.co.uk/news/rss.xml",
    category: "World",
    signal: "Developing",
    enabled: true,
  },
  {
    id: "cisa-advisories",
    sourceName: "CISA",
    feedUrl: "https://www.cisa.gov/cybersecurity-advisories/all.xml",
    category: "Technology",
    signal: "Developing",
    enabled: true,
  },
];

export function getEnabledFeeds(): RssFeedConfig[] {
  return RSS_FEEDS.filter((f) => f.enabled);
}
