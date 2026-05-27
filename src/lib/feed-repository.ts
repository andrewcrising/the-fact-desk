import { getEnabledFeeds } from "@/data/rssFeeds";
import { fetchRssFeedItems } from "@/lib/ingest/rss";
import { getOrCreateSource } from "@/lib/source-repository";
import { requireSupabaseAdmin } from "@/lib/supabase";
import { buildDedupeKey, canonicalizeUrl, urlOrigin } from "@/lib/url";
import { slugWithSuffix } from "@/lib/slug";
import type {
  FeedItem,
  FeedItemQuery,
  FeedItemStatus,
  IngestSummary,
  PersistedStory,
} from "@/types/editorial";
import { createStory, getStoryById } from "@/lib/story-repository";

const PER_FEED_LIMIT = 12;

interface FeedItemRow {
  id: string;
  source_id: string;
  title: string;
  url: string;
  canonical_url: string;
  author: string | null;
  published_at: string | null;
  summary: string | null;
  raw_payload: Record<string, unknown> | null;
  status: FeedItemStatus;
  dedupe_key: string;
  created_at: string;
  updated_at: string;
  sources?: { name: string } | null;
}

function mapFeedItem(row: FeedItemRow): FeedItem {
  return {
    id: row.id,
    sourceId: row.source_id,
    sourceName: row.sources?.name,
    title: row.title,
    url: row.url,
    canonicalUrl: row.canonical_url,
    author: row.author,
    publishedAt: row.published_at,
    summary: row.summary,
    rawPayload: row.raw_payload,
    status: row.status,
    dedupeKey: row.dedupe_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listFeedItems(query: FeedItemQuery = {}): Promise<FeedItem[]> {
  const supabase = requireSupabaseAdmin();
  let request = supabase
    .from("feed_items")
    .select("*, sources(name)")
    .order("created_at", { ascending: false })
    .limit(query.limit ?? 100);

  if (query.status && query.status !== "all") {
    request = request.eq("status", query.status);
  }
  if (query.source) {
    request = request.eq("source_id", query.source);
  }
  if (query.search) {
    request = request.ilike("title", `%${query.search}%`);
  }

  const { data, error } = await request;
  if (error) throw error;
  return ((data ?? []) as FeedItemRow[]).map(mapFeedItem);
}

export async function getFeedItemById(id: string): Promise<FeedItem | null> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("feed_items")
    .select("*, sources(name)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapFeedItem(data as FeedItemRow) : null;
}

export async function updateFeedItemStatus(
  id: string,
  status: FeedItemStatus,
): Promise<FeedItem> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("feed_items")
    .update({ status })
    .eq("id", id)
    .select("*, sources(name)")
    .single();

  if (error) throw error;
  return mapFeedItem(data as FeedItemRow);
}

export async function ingestConfiguredRssFeeds(): Promise<IngestSummary> {
  const supabase = requireSupabaseAdmin();
  const feeds = getEnabledFeeds();
  const summary: IngestSummary = {
    feedsChecked: 0,
    itemsFound: 0,
    newItemsInserted: 0,
    duplicatesSkipped: 0,
    errors: [],
  };

  for (const feed of feeds) {
    summary.feedsChecked += 1;

    try {
      const source = await getOrCreateSource({
        name: feed.sourceName,
        homepageUrl: urlOrigin(feed.feedUrl),
        feedUrl: feed.feedUrl,
        sourceType: "rss",
        active: feed.enabled,
      });

      const items = await fetchRssFeedItems(feed.feedUrl, PER_FEED_LIMIT);
      summary.itemsFound += items.length;

      for (const item of items) {
        const url = item.link ?? feed.feedUrl;
        const canonicalUrl = canonicalizeUrl(url);
        const publishedAt = item.pubDate
          ? new Date(item.pubDate).toISOString()
          : null;
        const dedupeKey = buildDedupeKey({
          sourceId: source.id,
          title: item.title,
          canonicalUrl,
          publishedAt,
        });

        const { error } = await supabase.from("feed_items").insert({
          source_id: source.id,
          title: item.title,
          url,
          canonical_url: canonicalUrl,
          author: item.author ?? null,
          published_at: publishedAt,
          summary: item.description ?? null,
          raw_payload: item.rawPayload ?? null,
          status: "new",
          dedupe_key: dedupeKey,
        });

        if (error?.code === "23505") {
          summary.duplicatesSkipped += 1;
          continue;
        }
        if (error) throw error;
        summary.newItemsInserted += 1;
      }
    } catch (error) {
      summary.errors.push({
        feedUrl: feed.feedUrl,
        message: error instanceof Error ? error.message : "Unknown ingest error",
      });
    }
  }

  return summary;
}

export async function promoteFeedItemToDraft(id: string): Promise<PersistedStory> {
  const item = await getFeedItemById(id);
  if (!item) {
    throw new Error("Feed item not found");
  }

  const supabase = requireSupabaseAdmin();
  const { data: existingSelection, error: selectionError } = await supabase
    .from("editorial_selections")
    .select("story_id")
    .eq("feed_item_id", id)
    .maybeSingle();

  if (selectionError) throw selectionError;
  if (existingSelection?.story_id) {
    const existingStory = await getStoryById(existingSelection.story_id as string);
    if (existingStory) return existingStory;
  }

  if (item.status === "promoted") {
    throw new Error("Feed item has already been promoted.");
  }

  const story = await createStory({
    title: item.title,
    slug: slugWithSuffix(item.title),
    summary: item.summary ?? item.title,
    whatHappened: item.summary ? `${item.title}. ${item.summary}` : item.title,
    whyItMatters: "Editorial review needed before publication.",
    coverageAngle: "Created from an RSS inbox item; verify and expand before publishing.",
    category: "World",
    signal: "Developing",
    confidence: "Single-source",
    status: "draft",
    tags: ["rss-inbox"],
    sourceAttachments: [
      {
        sourceName: item.sourceName ?? "RSS",
        url: item.canonicalUrl,
        title: item.title,
        feedItemId: item.id,
        publishedAt: item.publishedAt,
      },
    ],
  });

  await updateFeedItemStatus(id, "promoted");

  await supabase.from("editorial_selections").insert({
    feed_item_id: id,
    story_id: story.id,
    selection_reason: "Promoted from editorial inbox",
    status: "draft_created",
  });

  return story;
}
