import { RSS_FEEDS } from "@/data/rssFeeds";
import { requireSupabaseAdmin } from "@/lib/supabase";
import { urlOrigin } from "@/lib/url";
import type { SourceRecord, SourceType } from "@/types/editorial";

interface SourceRow {
  id: string;
  name: string;
  homepage_url: string | null;
  feed_url: string | null;
  source_type: SourceType;
  credibility_score: number | null;
  political_or_editorial_label: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

function mapSource(row: SourceRow): SourceRecord {
  return {
    id: row.id,
    name: row.name,
    homepageUrl: row.homepage_url,
    feedUrl: row.feed_url,
    sourceType: row.source_type,
    credibilityScore: row.credibility_score,
    politicalOrEditorialLabel: row.political_or_editorial_label,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSources(): Promise<SourceRecord[]> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as SourceRow[]).map(mapSource);
}

export async function getOrCreateSource(input: {
  name: string;
  homepageUrl?: string | null;
  feedUrl?: string | null;
  sourceType?: SourceType;
  active?: boolean;
}): Promise<SourceRecord> {
  const supabase = requireSupabaseAdmin();

  if (input.feedUrl) {
    const { data: existing, error: existingError } = await supabase
      .from("sources")
      .select("*")
      .eq("feed_url", input.feedUrl)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) return mapSource(existing as SourceRow);
  }

  const homepageUrl = input.homepageUrl ?? (input.feedUrl ? urlOrigin(input.feedUrl) : null);
  const { data, error } = await supabase
    .from("sources")
    .insert({
      name: input.name,
      homepage_url: homepageUrl,
      feed_url: input.feedUrl ?? null,
      source_type: input.sourceType ?? "manual",
      active: input.active ?? true,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapSource(data as SourceRow);
}

export async function ensureConfiguredSources(): Promise<SourceRecord[]> {
  const sources: SourceRecord[] = [];

  for (const feed of RSS_FEEDS) {
    const source = await getOrCreateSource({
      name: feed.sourceName,
      homepageUrl: urlOrigin(feed.feedUrl),
      feedUrl: feed.feedUrl,
      sourceType: "rss",
      active: feed.enabled,
    });
    sources.push(source);
  }

  return sources;
}
