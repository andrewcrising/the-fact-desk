import { getEnabledFeeds } from "@/data/rssFeeds";
import { readFactDeskFeedMetadata, withFactDeskFeedMetadata } from "@/lib/feed-metadata";
import { fetchRssFeedItems } from "@/lib/ingest/rss";
import { getOrCreateSource } from "@/lib/source-repository";
import { requireSupabaseAdmin } from "@/lib/supabase";
import { buildDedupeKey, canonicalizeUrl } from "@/lib/url";
import { slugWithSuffix } from "@/lib/slug";
import type {
  FeedItem,
  FeedItemQuery,
  FeedItemStatus,
  IngestSummary,
  PersistedStory,
} from "@/types/editorial";
import { archiveStory, createStory, getStoryById } from "@/lib/story-repository";

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

export function normalizeFeedPublishedAt(value?: string): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

export async function listFeedItems(query: FeedItemQuery = {}): Promise<FeedItem[]> {
  const supabase = requireSupabaseAdmin();
  let request = supabase
    .from("feed_items")
    .select("*, sources(name)")
    .order("created_at", { ascending: false })
    .limit(query.limit ?? 100);

  if (query.status && query.status !== "all") request = request.eq("status", query.status);
  if (query.source) request = request.eq("source_id", query.source);
  if (query.search) request = request.ilike("title", `%${query.search}%`);

  const { data, error } = await request;
  if (error) throw error;
  return ((data ?? []) as FeedItemRow[]).map(mapFeedItem);
}

export async function countFeedItemsByStatus(status: FeedItemStatus): Promise<number> {
  const supabase = requireSupabaseAdmin();
  const { count, error } = await supabase
    .from("feed_items")
    .select("id", { count: "exact", head: true })
    .eq("status", status);
  if (error) throw error;
  return count ?? 0;
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
        homepageUrl: feed.homepageUrl,
        feedUrl: feed.feedUrl,
        sourceType: feed.sourceType,
        credibilityScore: feed.credibilityScore,
        politicalOrEditorialLabel: feed.editorialLabel,
        active: feed.enabled,
      });

      const items = await fetchRssFeedItems(feed.feedUrl, PER_FEED_LIMIT);
      summary.itemsFound += items.length;

      // One malformed item should not discard otherwise healthy items from the
      // same feed. Dedupe remains database-enforced via dedupe_key uniqueness.
      for (const item of items) {
        try {
          const url = item.link ?? feed.feedUrl;
          const canonicalUrl = canonicalizeUrl(url);
          const publishedAt = normalizeFeedPublishedAt(item.pubDate);
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
            raw_payload: withFactDeskFeedMetadata(item.rawPayload, {
              feedId: feed.id,
              category: feed.category,
              signal: feed.signal,
            }),
            status: "new",
            dedupe_key: dedupeKey,
          });

          if (error?.code === "23505") {
            summary.duplicatesSkipped += 1;
            continue;
          }
          if (error) throw error;
          summary.newItemsInserted += 1;
        } catch (error) {
          summary.errors.push({
            feedUrl: feed.feedUrl,
            message: `${item.title}: ${error instanceof Error ? error.message : "Unable to persist feed item"}`,
          });
        }
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

async function findStoryLinkedToFeedItem(feedItemId: string): Promise<PersistedStory | null> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("story_sources")
    .select("story_id")
    .eq("feed_item_id", feedItemId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.story_id) return null;
  return getStoryById(data.story_id as string);
}

async function recordInboxSelection(feedItemId: string, storyId: string): Promise<void> {
  const supabase = requireSupabaseAdmin();
  const { error } = await supabase.from("editorial_selections").insert({
    feed_item_id: feedItemId,
    story_id: storyId,
    selection_reason: "Promoted from editorial inbox",
    status: "draft_created",
  });
  if (error) throw error;
}

export async function promoteFeedItemToDraft(id: string): Promise<PersistedStory> {
  const item = await getFeedItemById(id);
  if (!item) throw new Error("Feed item not found");

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

  // Recover a draft created before a prior request failed to write its
  // editorial_selection row. This prevents an orphan draft from multiplying.
  const linkedStory = await findStoryLinkedToFeedItem(id);
  if (linkedStory) {
    await recordInboxSelection(id, linkedStory.id);
    if (item.status !== "promoted") await updateFeedItemStatus(id, "promoted");
    return linkedStory;
  }

  if (item.status === "promoted") {
    throw new Error("Feed item is marked promoted but has no recoverable linked story.");
  }

  const metadata = readFactDeskFeedMetadata(item.rawPayload);
  const story = await createStory({
    title: item.title,
    slug: slugWithSuffix(item.title),
    summary: item.summary ?? item.title,
    whatHappened: item.summary ? `${item.title}. ${item.summary}` : item.title,
    whyItMatters: "Editorial review needed before publication.",
    coverageAngle: "Created from an RSS inbox item; verify and expand before publishing.",
    uncertaintyNote:
      "This draft is based on a raw feed item and needs human source review before publication.",
    category: metadata.category ?? "World",
    signal: metadata.signal ?? "Developing",
    confidence: "Single-source",
    evidenceLevel: "Low",
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

  try {
    await recordInboxSelection(id, story.id);
  } catch (error) {
    // If a concurrent request won the unique feed-item selection race, keep the
    // canonical winner and archive this request's duplicate draft.
    const { data: winner } = await supabase
      .from("editorial_selections")
      .select("story_id")
      .eq("feed_item_id", id)
      .maybeSingle();
    if (winner?.story_id) {
      await archiveStory(story.id);
      const winnerStory = await getStoryById(winner.story_id as string);
      if (winnerStory) return winnerStory;
    }
    throw error;
  }

  // Promotion status is the final step: a failed selection write therefore
  // leaves the item retryable instead of permanently hiding it from the inbox.
  await updateFeedItemStatus(id, "promoted");
  return story;
}
