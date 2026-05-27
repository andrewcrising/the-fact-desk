/**
 * Story repository — the data access boundary for public pages, APIs, and
 * editorial tools.
 *
 * Production source of truth: Supabase/Postgres tables in supabase/schema.sql.
 * Development fallback: src/data/stories.ts, used only when Supabase is not
 * configured or a published-story query fails. This keeps the current visual
 * demo safe while the MVP backend is being connected.
 */
import { stories as mockStories } from "@/data/stories";
import { getOrCreateSource } from "@/lib/source-repository";
import {
  getSupabaseAdmin,
  requireSupabaseAdmin,
} from "@/lib/supabase";
import { readLiveStoriesCache } from "@/lib/live-stories-cache";
import { readRssCache } from "@/lib/rss-cache";
import { slugify } from "@/lib/slug";
import { urlOrigin } from "@/lib/url";
import type {
  PersistedStory,
  StoryInput,
  StoryQuery,
  StorySource,
  StorySourceInput,
  StoryStatus,
  StoryUpdateInput,
} from "@/types/editorial";
import type { Confidence, Signal, Story, StoryCategory } from "@/types/story";

interface StoryRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  what_happened: string;
  why_it_matters: string;
  coverage_angle: string | null;
  category: StoryCategory;
  signal: Signal;
  confidence: Confidence;
  status: StoryStatus;
  homepage_rank: number | null;
  is_lead: boolean;
  tags: unknown;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface StorySourceRow {
  id: string;
  story_id: string;
  source_id: string;
  feed_item_id: string | null;
  url: string;
  title: string;
  source_name: string;
  published_at: string | null;
  created_at: string;
}

export function isRssCacheEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_RSS_CACHE === "true";
}

export function isLiveBetaEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_LIVE_BETA === "true";
}

export function isMergedStoriesEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_MERGED_STORIES === "true";
}

export function isMockFallbackAllowed(): boolean {
  return (
    process.env.ALLOW_MOCK_FALLBACK === "true" ||
    process.env.NODE_ENV !== "production"
  );
}

function tagsFromJson(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function mapStorySource(row: StorySourceRow): StorySource {
  return {
    id: row.id,
    storyId: row.story_id,
    sourceId: row.source_id,
    feedItemId: row.feed_item_id,
    url: row.url,
    title: row.title,
    sourceName: row.source_name,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

async function getStorySources(storyId: string): Promise<StorySource[]> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("story_sources")
    .select("*")
    .eq("story_id", storyId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as StorySourceRow[]).map(mapStorySource);
}

async function mapPersistedStory(row: StoryRow): Promise<PersistedStory> {
  const storySources = await getStorySources(row.id);
  const sourceNames =
    storySources.length > 0
      ? storySources.map((source) => source.sourceName)
      : ["Editorial desk"];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    whatHappened: row.what_happened,
    whyItMatters: row.why_it_matters,
    category: row.category,
    confidence: row.confidence,
    signal: row.signal,
    sources: sourceNames,
    sourceUrls: storySources.map((source) => source.url),
    publishedAt: row.published_at ?? row.created_at,
    updatedAt: row.updated_at,
    tags: tagsFromJson(row.tags),
    coverageAngle: row.coverage_angle ?? undefined,
    status: row.status,
    homepageRank: row.homepage_rank,
    isLead: row.is_lead,
    storySources,
    createdAt: row.created_at,
  };
}

function mapMockStory(story: Story): PersistedStory {
  return {
    ...story,
    status: "published",
    homepageRank: null,
    isLead: story.signal === "Top Signal",
    storySources:
      story.sourceUrls?.map((url, index) => ({
        id: `${story.id}-source-${index}`,
        storyId: story.id,
        sourceId: `mock-source-${index}`,
        feedItemId: null,
        url,
        title: story.title,
        sourceName: story.sources[index] ?? story.sources[0] ?? "Mock source",
        publishedAt: story.publishedAt,
        createdAt: story.publishedAt,
      })) ?? [],
    createdAt: story.publishedAt,
  };
}

export function getMockStories(): PersistedStory[] {
  return mockStories.map(mapMockStory);
}

export function getAllStories(): Story[] {
  return [...mockStories];
}

/** Cached live RSS from data/live-stories.json (server-only). */
export function getCachedLiveStories(): Story[] {
  if (typeof window !== "undefined") {
    return [];
  }
  return readLiveStoriesCache().stories;
}

/** Legacy dev cache from data/rss-cache.json. */
export function getCachedRssStories(): Story[] {
  if (typeof window !== "undefined" || !isRssCacheEnabled()) {
    return [];
  }
  return readRssCache().stories;
}

/** Mock + cached live stories, deduped by slug (mock wins). */
export function getMergedStories(): Story[] {
  const mock = getAllStories();
  const slugs = new Set(mock.map((s) => s.slug));
  const live = getCachedLiveStories().filter((s) => !slugs.has(s.slug));
  return [...mock, ...live];
}

/** Live Beta section — read-only preview only; it never publishes stories. */
export async function getLivePreviewStories() {
  if (!isLiveBetaEnabled()) {
    return { stories: [], source: "cache" as const, fetchedAt: null };
  }
  const { getLiveFeed } = await import("@/lib/live-data");
  return getLiveFeed();
}

export async function listStories(query: StoryQuery = {}): Promise<PersistedStory[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    if (!isMockFallbackAllowed()) return [];
    if (query.status && query.status !== "published" && query.status !== "all") return [];
    return getMockStories();
  }

  let request = supabase
    .from("stories")
    .select("*")
    .order("is_lead", { ascending: false })
    .order("homepage_rank", { ascending: true, nullsFirst: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(query.limit ?? 100);

  const status = query.status ?? "published";
  if (status !== "all") request = request.eq("status", status);
  if (query.category) request = request.eq("category", query.category);
  if (query.signal) request = request.eq("signal", query.signal);
  if (query.search) request = request.ilike("title", `%${query.search}%`);

  const { data, error } = await request;
  if (error) {
    if (query.status && query.status !== "published" && query.status !== "all") throw error;
    return isMockFallbackAllowed() ? getMockStories() : [];
  }

  const stories = await Promise.all(((data ?? []) as StoryRow[]).map(mapPersistedStory));
  if (stories.length === 0 && (!query.status || query.status === "published")) {
    return isMockFallbackAllowed() ? getMockStories() : [];
  }

  return stories;
}

/** Public homepage stories: published DB stories first, mock fallback only in dev/demo. */
export async function getHomepageStories(): Promise<PersistedStory[]> {
  return listStories({ status: "published" });
}

export async function getStoryBySlug(slug: string): Promise<PersistedStory | undefined> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return isMockFallbackAllowed()
      ? getMockStories().find((s) => s.slug === slug)
      : undefined;
  }

  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    return isMockFallbackAllowed()
      ? getMockStories().find((s) => s.slug === slug)
      : undefined;
  }
  if (!data) return undefined;
  return mapPersistedStory(data as StoryRow);
}

export async function getStoryById(id: string): Promise<PersistedStory | null> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapPersistedStory(data as StoryRow) : null;
}

export async function getStoriesBySignal(signal: Signal): Promise<PersistedStory[]> {
  return listStories({ status: "published", signal });
}

export async function getStoriesByCategory(
  category: StoryCategory,
): Promise<PersistedStory[]> {
  return listStories({ status: "published", category });
}

/** Pre-render mock fallback slugs; DB slugs resolve dynamically at request time. */
export function getAllSlugs(): string[] {
  return mockStories.map((s) => s.slug);
}

function toStoryRow(input: StoryInput | StoryUpdateInput) {
  return {
    slug: input.slug ? slugify(input.slug) : undefined,
    title: input.title,
    summary: input.summary,
    what_happened: input.whatHappened,
    why_it_matters: input.whyItMatters,
    coverage_angle: input.coverageAngle ?? null,
    category: input.category,
    signal: input.signal,
    confidence: input.confidence,
    status: input.status,
    homepage_rank: input.homepageRank ?? null,
    is_lead: input.isLead,
    tags: input.tags ?? [],
  };
}

export async function createStory(input: StoryInput): Promise<PersistedStory> {
  const supabase = requireSupabaseAdmin();
  const slug = slugify(input.slug ?? input.title);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("stories")
    .insert({
      ...toStoryRow({ ...input, slug }),
      slug,
      status: input.status ?? "draft",
      published_at: input.status === "published" ? now : null,
      is_lead: input.isLead ?? false,
      homepage_rank: input.homepageRank ?? null,
      tags: input.tags ?? [],
    })
    .select("*")
    .single();

  if (error) throw error;
  const story = await mapPersistedStory(data as StoryRow);

  if (input.sourceAttachments?.length) {
    return replaceStorySources(story.id, input.sourceAttachments);
  }

  return story;
}

export async function updateStory(
  id: string,
  input: StoryUpdateInput,
): Promise<PersistedStory> {
  if (input.status === "published") {
    throw new Error("Use the publish endpoint to publish stories.");
  }

  const supabase = requireSupabaseAdmin();
  const row = toStoryRow(input);
  const cleanRow = Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== undefined),
  );

  const { data, error } = await supabase
    .from("stories")
    .update(cleanRow)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  if (input.sourceAttachments) {
    return replaceStorySources(id, input.sourceAttachments);
  }

  return mapPersistedStory(data as StoryRow);
}

export async function publishStory(
  id: string,
  options: { homepageRank?: number | null; isLead?: boolean } = {},
): Promise<PersistedStory> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("stories")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      homepage_rank: options.homepageRank ?? null,
      is_lead: options.isLead ?? false,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapPersistedStory(data as StoryRow);
}

export async function archiveStory(id: string): Promise<PersistedStory> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("stories")
    .update({ status: "archived", is_lead: false, homepage_rank: null })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapPersistedStory(data as StoryRow);
}

export async function promoteStory(
  id: string,
  options: { homepageRank?: number | null; isLead?: boolean } = {},
): Promise<PersistedStory> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("stories")
    .update({
      homepage_rank: options.homepageRank ?? 1,
      is_lead: options.isLead ?? false,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapPersistedStory(data as StoryRow);
}

export async function replaceStorySources(
  storyId: string,
  sources: StorySourceInput[],
): Promise<PersistedStory> {
  const supabase = requireSupabaseAdmin();
  await supabase.from("story_sources").delete().eq("story_id", storyId);

  for (const sourceInput of sources.filter((source) => source.url && source.sourceName)) {
    const source = sourceInput.sourceId
      ? { id: sourceInput.sourceId }
      : await getOrCreateSource({
          name: sourceInput.sourceName,
          homepageUrl: urlOrigin(sourceInput.url),
          sourceType: "manual",
        });

    const { error } = await supabase.from("story_sources").insert({
      story_id: storyId,
      source_id: source.id,
      feed_item_id: sourceInput.feedItemId ?? null,
      url: sourceInput.url,
      title: sourceInput.title ?? sourceInput.url,
      source_name: sourceInput.sourceName,
      published_at: sourceInput.publishedAt ?? null,
    });

    if (error) throw error;
  }

  const story = await getStoryById(storyId);
  if (!story) throw new Error("Story not found after replacing sources");
  return story;
}

export function getLiveCacheMeta() {
  if (typeof window !== "undefined") {
    return { generatedAt: null, feedCount: 0, storyCount: 0 };
  }
  const cache = readLiveStoriesCache();
  return {
    generatedAt: cache.generatedAt,
    feedCount: cache.feedCount,
    storyCount: cache.stories.length,
  };
}

/** Live fetch proof for /api/test-rss — does not affect homepage. */
export async function getIngestedStoriesPreview() {
  const {
    DEFAULT_TEST_RSS_FEED,
    DEFAULT_TEST_RSS_OPTIONS,
    fetchRssStories,
  } = await import("@/lib/ingest/rss");

  return fetchRssStories(DEFAULT_TEST_RSS_FEED, DEFAULT_TEST_RSS_OPTIONS);
}
