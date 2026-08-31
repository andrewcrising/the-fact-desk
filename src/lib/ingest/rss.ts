/**
 * RSS/Atom ingestion and normalization.
 */
import { buildFastWhyItMatters } from "@/lib/ingest/fast-briefing";
import type { Signal, Story, StoryCategory } from "@/types/story";
import { XMLParser } from "fast-xml-parser";

const STORY_CATEGORIES: StoryCategory[] = [
  "Politics", "Markets", "Technology", "World", "Health", "Courts", "Energy", "Culture",
];
const SIGNALS: Signal[] = [
  "Top Signal", "Under-covered", "Cross-angle", "Developing",
];

export interface FetchRssStoriesOptions {
  category?: StoryCategory | string;
  sourceName?: string;
  signal?: Signal | string;
  limit?: number;
  timeoutMs?: number;
  strict?: boolean;
}

interface RssItemRaw {
  title: string;
  link?: string;
  description?: string;
  pubDate?: string;
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

function resolveLink(value: unknown): string | undefined {
  const direct = asString(value);
  if (direct) return direct;

  if (Array.isArray(value)) {
    const preferred =
      value.find(
        (entry) =>
          typeof entry === "object" &&
          entry !== null &&
          (entry as { "@_rel"?: string })["@_rel"] === "alternate",
      ) ?? value[0];
    return resolveLink(preferred);
  }

  if (typeof value === "object" && value !== null) {
    return asString((value as { "@_href"?: unknown })["@_href"]);
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
  return Number.isNaN(parsed)
    ? new Date().toISOString()
    : new Date(parsed).toISOString();
}

function resolveCategory(value?: string): StoryCategory {
  return value && STORY_CATEGORIES.includes(value as StoryCategory)
    ? (value as StoryCategory)
    : "World";
}

function resolveSignal(value?: string): Signal {
  return value && SIGNALS.includes(value as Signal)
    ? (value as Signal)
    : "Developing";
}

function parseRssItems(xml: string): RssItemRaw[] {
  try {
    const parsed = xmlParser.parse(xml);
    const channel = parsed?.rss?.channel ?? parsed?.feed ?? parsed?.["rdf:RDF"];
    if (!channel) return [];

    const rawItems = channel.item ?? channel.entry;
    if (!rawItems) return [];

    const items = Array.isArray(rawItems) ? rawItems : [rawItems];
    const result: RssItemRaw[] = [];

    for (const item of items) {
      const record = item as Record<string, unknown>;
      const title = stripHtml(asString(record.title) ?? "");
      if (!title) continue;

      const link =
        resolveLink(record.link) ??
        resolveLink(record.guid) ??
        resolveLink(record.id);
      const description =
        asString(record.description) ??
        asString(record.summary) ??
        asString(record.content) ??
        asString(record["content:encoded"]);
      const pubDate =
        asString(record.pubDate) ??
        asString(record.published) ??
        asString(record.updated) ??
        asString(record["dc:date"]);

      result.push({
        title,
        link,
        description: description ? stripHtml(description) : undefined,
        pubDate,
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
  item: RssItemRaw,
  index: number,
  options: FetchRssStoriesOptions,
): Story {
  const sourceName = options.sourceName ?? "RSS";
  const category = resolveCategory(options.category);
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
    whyItMatters: buildFastWhyItMatters(item.title, summary, category),
    category,
    confidence: "Single-source",
    signal: resolveSignal(options.signal),
    sources: [sourceName],
    sourceUrls: item.link ? [item.link] : undefined,
    publishedAt,
    updatedAt: publishedAt,
    tags: buildTags(sourceName),
    coverageAngle:
      "Fast briefing generated from source-provided feed text; details should update as corroborating coverage arrives.",
  };
}

export async function fetchRssStories(
  feedUrl: string,
  options: FetchRssStoriesOptions = {},
): Promise<Story[]> {
  const limit = options.limit ?? 12;

  try {
    const response = await fetch(feedUrl, {
      headers: {
        Accept:
          "application/rss+xml, application/xml, text/xml, application/atom+xml, */*",
        "User-Agent":
          "TheFactDesk/0.2 (personal RSS proof; contact via linked source)",
      },
      signal: AbortSignal.timeout(options.timeoutMs ?? 8000),
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Feed returned ${response.status}`);
    }

    const xml = await response.text();
    const items = parseRssItems(xml).slice(0, limit);
    return items.map((item, index) => normalizeItem(item, index, options));
  } catch (error) {
    if (options.strict) throw error;
    return [];
  }
}

export const DEFAULT_TEST_RSS_FEED =
  "https://feeds.npr.org/1001/rss.xml";

export const DEFAULT_TEST_RSS_OPTIONS: FetchRssStoriesOptions = {
  sourceName: "NPR",
  category: "World",
  signal: "Developing",
  limit: 10,
};
