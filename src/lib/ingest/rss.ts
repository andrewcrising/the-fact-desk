/**
 * RSS ingestion — normalizes feeds into `Story`.
 *
 * Uses fast-xml-parser for reliable NPR/BBC/CISA-style RSS (namespaces, CDATA,
 * varying item shapes). Regex parsing was too fragile across feeds.
 *
 * Later: cron job writes to Supabase/Blob; this module stays the normalizer.
 */
import type { Signal, Story, StoryCategory } from "@/types/story";
import { XMLParser } from "fast-xml-parser";

const STORY_CATEGORIES: StoryCategory[] = [
  "Politics",
  "Markets",
  "Technology",
  "World",
  "Health",
  "Courts",
  "Energy",
  "Culture",
];

const SIGNALS: Signal[] = [
  "Top Signal",
  "Under-covered",
  "Cross-angle",
  "Developing",
];

export interface FetchRssStoriesOptions {
  category?: StoryCategory | string;
  sourceName?: string;
  signal?: Signal | string;
  limit?: number;
}

export interface RssFeedItem {
  title: string;
  link?: string;
  author?: string;
  description?: string;
  pubDate?: string;
  rawPayload?: Record<string, unknown>;
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  parseTagValue: false,
});

function stripHtml(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function asString(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && value !== null && "#text" in value) {
    return asString((value as { "#text": unknown })["#text"]);
  }
  return undefined;
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return base || "rss-item";
}

function stableSlug(title: string, link?: string, index = 0): string {
  const base = slugify(title);
  if (link) {
    const suffix = Buffer.from(link).toString("base64url").slice(0, 8);
    return `${base}-${suffix}`;
  }
  return `${base}-${index}`;
}

function parsePubDate(value?: string): string {
  if (!value) return new Date().toISOString();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
}

function resolveCategory(value?: string): StoryCategory {
  if (value && STORY_CATEGORIES.includes(value as StoryCategory)) {
    return value as StoryCategory;
  }
  return "World";
}

function resolveSignal(value?: string): Signal {
  if (value && SIGNALS.includes(value as Signal)) {
    return value as Signal;
  }
  return "Developing";
}

export function parseRssItems(xml: string): RssFeedItem[] {
  try {
    const parsed = xmlParser.parse(xml);
    const channel = parsed?.rss?.channel ?? parsed?.feed;
    if (!channel) return [];

    const rawItems = channel.item ?? channel.entry;
    if (!rawItems) return [];

    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    const result: RssFeedItem[] = [];

    for (const item of items) {
      const record = item as Record<string, unknown>;
      const title = stripHtml(asString(record.title) ?? "");
      if (!title) continue;

      const link =
        asString(record.link) ??
        asString(record.guid) ??
        (typeof record.link === "object" && record.link !== null
          ? asString((record.link as { "@_href"?: string })["@_href"])
          : undefined);

      const description =
        asString(record.description) ??
        asString(record.summary) ??
        asString(record["content:encoded"]);

      const pubDate =
        asString(record.pubDate) ??
        asString(record.published) ??
        asString(record.updated);

      const author =
        asString(record.author) ??
        asString(record["dc:creator"]) ??
        (typeof record.author === "object" && record.author !== null
          ? asString((record.author as { name?: string })["name"])
          : undefined);

      result.push({
        title,
        link,
        author,
        description: description ? stripHtml(description) : undefined,
        pubDate,
        rawPayload: record,
      });
    }

    return result;
  } catch {
    return [];
  }
}

function buildTags(sourceName: string): string[] {
  const slug = sourceName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return ["live-rss", slug || "rss"];
}

function normalizeItem(
  item: RssFeedItem,
  index: number,
  options: FetchRssStoriesOptions,
): Story {
  const sourceName = options.sourceName ?? "RSS";
  const description = item.description ?? "";
  const summary =
    description.length > 220
      ? `${description.slice(0, 217)}…`
      : description || item.title;

  const whatHappened = description
    ? `${item.title}. ${description}`
    : item.title;

  const publishedAt = parsePubDate(item.pubDate);
  const slug = stableSlug(item.title, item.link, index);

  return {
    id: `live-${slug}`,
    slug,
    title: item.title,
    summary,
    whatHappened,
    whyItMatters:
      "This story is newly ingested and has not yet been fully analyzed.",
    category: resolveCategory(options.category),
    confidence: "Single-source",
    evidenceLevel: "Low",
    signal: resolveSignal(options.signal),
    sources: [sourceName],
    sourceUrls: item.link ? [item.link] : undefined,
    publishedAt,
    updatedAt: publishedAt,
    tags: buildTags(sourceName),
    uncertaintyNote:
      "Raw RSS item; not yet reviewed, ranked, or corroborated by The Fact Desk.",
  };
}

/**
 * Fetch an RSS feed and normalize entries into `Story` objects.
 * Returns [] on failure (does not throw to callers).
 */
export async function fetchRssStories(
  feedUrl: string,
  options: FetchRssStoriesOptions = {},
): Promise<Story[]> {
  const limit = options.limit ?? 12;

  try {
    const response = await fetch(feedUrl, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml, application/atom+xml, */*",
        "User-Agent": "TheFactDesk/0.1 (RSS ingestion beta)",
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    const items = parseRssItems(xml).slice(0, limit);

    return items.map((item, index) => normalizeItem(item, index, options));
  } catch {
    return [];
  }
}

/**
 * Fetch an RSS/Atom feed and return normalized raw inbox candidates.
 * This is the durable ingest path; callers persist these as feed_items.
 */
export async function fetchRssFeedItems(
  feedUrl: string,
  limit = 12,
): Promise<RssFeedItem[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml, application/atom+xml, */*",
        "User-Agent": "TheFactDesk/0.1 (RSS editorial ingest)",
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Feed returned ${response.status}`);
    }

    const xml = await response.text();
    return parseRssItems(xml).slice(0, limit);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown RSS error";
    throw new Error(`Unable to fetch RSS feed ${feedUrl}: ${message}`);
  }
}

/** Used by /api/test-rss proof route. */
export const DEFAULT_TEST_RSS_FEED = "https://feeds.npr.org/1001/rss.xml";

export const DEFAULT_TEST_RSS_OPTIONS: FetchRssStoriesOptions = {
  sourceName: "NPR",
  category: "World",
  signal: "Developing",
  limit: 10,
};
