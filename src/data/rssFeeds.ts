import type { Signal, StoryCategory } from "@/types/story";

export interface RssFeedConfig {
  id: string;
  sourceName: string;
  feedUrl: string;
  category: StoryCategory;
  signal: Signal;
  enabled: boolean;
  /**
   * Omit unless a reviewed licence expressly permits public reuse of the feed
   * description. The ingestion layer otherwise treats descriptions as
   * analysis-only and never publishes them.
   */
  syndicationLicense?: {
    licenseUrl: string;
    summaryReuse: true;
  };
}

/**
 * Curated public RSS/Atom feeds that require no API keys.
 *
 * Several section feeds may belong to the same publisher. They intentionally
 * share sourceName so clustering counts publishers, not feed URLs.
 * One unreachable feed never breaks the batch.
 */
export const RSS_FEEDS: RssFeedConfig[] = [
  {
    "id": "npr-news",
    "sourceName": "NPR",
    "feedUrl": "https://feeds.npr.org/1001/rss.xml",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "npr-politics",
    "sourceName": "NPR",
    "feedUrl": "https://feeds.npr.org/1014/rss.xml",
    "category": "Politics",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "npr-business",
    "sourceName": "NPR",
    "feedUrl": "https://feeds.npr.org/1006/rss.xml",
    "category": "Markets",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "npr-technology",
    "sourceName": "NPR",
    "feedUrl": "https://feeds.npr.org/1019/rss.xml",
    "category": "Technology",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "npr-arts",
    "sourceName": "NPR",
    "feedUrl": "https://feeds.npr.org/1008/rss.xml",
    "category": "Culture",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "bbc-news",
    "sourceName": "BBC",
    "feedUrl": "https://feeds.bbci.co.uk/news/rss.xml",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "bbc-world",
    "sourceName": "BBC",
    "feedUrl": "https://feeds.bbci.co.uk/news/world/rss.xml",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "bbc-politics",
    "sourceName": "BBC",
    "feedUrl": "https://feeds.bbci.co.uk/news/politics/rss.xml",
    "category": "Politics",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "bbc-business",
    "sourceName": "BBC",
    "feedUrl": "https://feeds.bbci.co.uk/news/business/rss.xml",
    "category": "Markets",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "bbc-technology",
    "sourceName": "BBC",
    "feedUrl": "https://feeds.bbci.co.uk/news/technology/rss.xml",
    "category": "Technology",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "bbc-health",
    "sourceName": "BBC",
    "feedUrl": "https://feeds.bbci.co.uk/news/health/rss.xml",
    "category": "Health",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "bbc-science",
    "sourceName": "BBC",
    "feedUrl": "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    "category": "Energy",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "bbc-culture",
    "sourceName": "BBC",
    "feedUrl": "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
    "category": "Culture",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "pbs-headlines",
    "sourceName": "PBS News",
    "feedUrl": "https://www.pbs.org/newshour/feeds/rss/headlines",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "pbs-politics",
    "sourceName": "PBS News",
    "feedUrl": "https://www.pbs.org/newshour/feeds/rss/politics",
    "category": "Politics",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "guardian-world",
    "sourceName": "The Guardian",
    "feedUrl": "https://www.theguardian.com/world/rss",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "guardian-us",
    "sourceName": "The Guardian",
    "feedUrl": "https://www.theguardian.com/us-news/rss",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "guardian-politics",
    "sourceName": "The Guardian",
    "feedUrl": "https://www.theguardian.com/politics/rss",
    "category": "Politics",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "guardian-business",
    "sourceName": "The Guardian",
    "feedUrl": "https://www.theguardian.com/business/rss",
    "category": "Markets",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "guardian-technology",
    "sourceName": "The Guardian",
    "feedUrl": "https://www.theguardian.com/technology/rss",
    "category": "Technology",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "guardian-health",
    "sourceName": "The Guardian",
    "feedUrl": "https://www.theguardian.com/society/health/rss",
    "category": "Health",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "guardian-culture",
    "sourceName": "The Guardian",
    "feedUrl": "https://www.theguardian.com/culture/rss",
    "category": "Culture",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "fox-latest",
    "sourceName": "Fox News",
    "feedUrl": "https://moxie.foxnews.com/google-publisher/latest.xml",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "fox-politics",
    "sourceName": "Fox News",
    "feedUrl": "https://moxie.foxnews.com/google-publisher/politics.xml",
    "category": "Politics",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "fox-world",
    "sourceName": "Fox News",
    "feedUrl": "https://moxie.foxnews.com/google-publisher/world.xml",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "examiner-news",
    "sourceName": "Washington Examiner",
    "feedUrl": "https://www.washingtonexaminer.com/section/news/feed",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "examiner-politics",
    "sourceName": "Washington Examiner",
    "feedUrl": "https://www.washingtonexaminer.com/section/politics/feed",
    "category": "Politics",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "dispatch-latest",
    "sourceName": "The Dispatch",
    "feedUrl": "https://thedispatch.com/feed/",
    "category": "Politics",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "al-jazeera",
    "sourceName": "Al Jazeera",
    "feedUrl": "https://www.aljazeera.com/xml/rss/all.xml",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "nyt-home",
    "sourceName": "The New York Times",
    "feedUrl": "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "nyt-world",
    "sourceName": "The New York Times",
    "feedUrl": "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "nyt-us",
    "sourceName": "The New York Times",
    "feedUrl": "https://rss.nytimes.com/services/xml/rss/nyt/US.xml",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "nyt-politics",
    "sourceName": "The New York Times",
    "feedUrl": "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
    "category": "Politics",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "nyt-business",
    "sourceName": "The New York Times",
    "feedUrl": "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
    "category": "Markets",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "nyt-technology",
    "sourceName": "The New York Times",
    "feedUrl": "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
    "category": "Technology",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "nyt-health",
    "sourceName": "The New York Times",
    "feedUrl": "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml",
    "category": "Health",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "nyt-science",
    "sourceName": "The New York Times",
    "feedUrl": "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml",
    "category": "Energy",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "nyt-arts",
    "sourceName": "The New York Times",
    "feedUrl": "https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml",
    "category": "Culture",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "abc-top",
    "sourceName": "ABC News",
    "feedUrl": "https://abcnews.go.com/abcnews/topstories",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "cbs-latest",
    "sourceName": "CBS News",
    "feedUrl": "https://www.cbsnews.com/latest/rss/main",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "nbc-news",
    "sourceName": "NBC News",
    "feedUrl": "https://feeds.nbcnews.com/nbcnews/public/news",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "usa-today",
    "sourceName": "CBC News",
    "feedUrl": "https://www.cbc.ca/webfeed/rss/rss-topstories",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "dw-all",
    "sourceName": "Deutsche Welle",
    "feedUrl": "https://rss.dw.com/rdf/rss-en-all",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "france24",
    "sourceName": "France 24",
    "feedUrl": "https://www.france24.com/en/rss",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "sky-world",
    "sourceName": "Sky News",
    "feedUrl": "https://feeds.skynews.com/feeds/rss/world.xml",
    "category": "World",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "politico-politics",
    "sourceName": "POLITICO",
    "feedUrl": "https://rss.politico.com/politics-news.xml",
    "category": "Politics",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "propublica-main",
    "sourceName": "ProPublica",
    "feedUrl": "https://feeds.propublica.org/propublica/main",
    "category": "Politics",
    "signal": "Under-covered",
    "enabled": true
  },
  {
    "id": "marketwatch-top",
    "sourceName": "MarketWatch",
    "feedUrl": "https://feeds.marketwatch.com/marketwatch/topstories/",
    "category": "Markets",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "cnbc-top",
    "sourceName": "CNBC",
    "feedUrl": "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    "category": "Markets",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "financial-times",
    "sourceName": "Financial Times",
    "feedUrl": "https://www.ft.com/?format=rss",
    "category": "Markets",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "federal-reserve",
    "sourceName": "Federal Reserve",
    "feedUrl": "https://www.federalreserve.gov/feeds/press_all.xml",
    "category": "Markets",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "sec-press",
    "sourceName": "U.S. SEC",
    "feedUrl": "https://www.sec.gov/news/pressreleases.rss",
    "category": "Markets",
    "signal": "Under-covered",
    "enabled": true
  },
  {
    "id": "the-verge",
    "sourceName": "The Verge",
    "feedUrl": "https://www.theverge.com/rss/index.xml",
    "category": "Technology",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "ars-technica",
    "sourceName": "Ars Technica",
    "feedUrl": "https://feeds.arstechnica.com/arstechnica/index",
    "category": "Technology",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "techcrunch",
    "sourceName": "TechCrunch",
    "feedUrl": "https://techcrunch.com/feed/",
    "category": "Technology",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "cisa-advisories",
    "sourceName": "CISA",
    "feedUrl": "https://www.cisa.gov/cybersecurity-advisories/all.xml",
    "category": "Technology",
    "signal": "Under-covered",
    "enabled": true
  },
  {
    "id": "who-news",
    "sourceName": "World Health Organization",
    "feedUrl": "https://www.who.int/rss-feeds/news-english.xml",
    "category": "Health",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "nih-news",
    "sourceName": "U.S. NIH",
    "feedUrl": "https://www.nih.gov/news-releases/feed.xml",
    "category": "Health",
    "signal": "Under-covered",
    "enabled": true
  },
  {
    "id": "fda-press",
    "sourceName": "U.S. FDA",
    "feedUrl": "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml",
    "category": "Health",
    "signal": "Under-covered",
    "enabled": true
  },
  {
    "id": "kff-health-news",
    "sourceName": "KFF Health News",
    "feedUrl": "https://kffhealthnews.org/feed/",
    "category": "Health",
    "signal": "Under-covered",
    "enabled": true
  },
  {
    "id": "stat-news",
    "sourceName": "STAT",
    "feedUrl": "https://www.statnews.com/feed/",
    "category": "Health",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "nasa-news",
    "sourceName": "NASA",
    "feedUrl": "https://www.nasa.gov/news-release/feed/",
    "category": "Energy",
    "signal": "Under-covered",
    "enabled": true
  },
  {
    "id": "nature",
    "sourceName": "Nature",
    "feedUrl": "https://www.nature.com/nature/articles?format=rss&type=news",
    "category": "Health",
    "signal": "Under-covered",
    "enabled": true
  },
  {
    "id": "science-news",
    "sourceName": "Science",
    "feedUrl": "https://www.science.org/rss/news_current.xml",
    "category": "Health",
    "signal": "Under-covered",
    "enabled": true
  },
  {
    "id": "doj-news",
    "sourceName": "U.S. Department of Justice",
    "feedUrl": "https://www.justice.gov/news/rss?m=1&type=press_release",
    "category": "Courts",
    "signal": "Under-covered",
    "enabled": true
  },
  {
    "id": "scotusblog",
    "sourceName": "SCOTUSblog",
    "feedUrl": "https://www.scotusblog.com/feed/",
    "category": "Courts",
    "signal": "Developing",
    "enabled": true
  },
  {
    "id": "eia-energy",
    "sourceName": "U.S. Energy Information Administration",
    "feedUrl": "https://www.eia.gov/rss/press_rss.xml",
    "category": "Energy",
    "signal": "Under-covered",
    "enabled": true
  },
  {
    "id": "iaea-news",
    "sourceName": "International Atomic Energy Agency",
    "feedUrl": "https://www.iaea.org/feeds/news",
    "category": "Energy",
    "signal": "Under-covered",
    "enabled": true
  }
];

export function getEnabledFeeds(): RssFeedConfig[] {
  return RSS_FEEDS.filter((feed) => feed.enabled);
}
