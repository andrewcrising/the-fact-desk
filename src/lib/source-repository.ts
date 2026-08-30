import { RSS_FEEDS } from "@/data/rssFeeds";
import { requireSupabaseAdmin } from "@/lib/supabase";
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

interface SourceInput {
  name: string;
  homepageUrl?: string | null;
  feedUrl?: string | null;
  sourceType?: SourceType;
  credibilityScore?: number | null;
  politicalOrEditorialLabel?: string | null;
  active?: boolean;
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

function sourceUpdate(input: SourceInput) {
  const update: Record<string, string | number | boolean | null> = {
    name: input.name,
  };

  if (input.homepageUrl !== undefined) update.homepage_url = input.homepageUrl;
  if (input.sourceType !== undefined) update.source_type = input.sourceType;
  if (input.credibilityScore !== undefined) update.credibility_score = input.credibilityScore;
  if (input.politicalOrEditorialLabel !== undefined) {
    update.political_or_editorial_label = input.politicalOrEditorialLabel;
  }
  if (input.active !== undefined) update.active = input.active;

  return update;
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

export async function getOrCreateSource(input: SourceInput): Promise<SourceRecord> {
  const supabase = requireSupabaseAdmin();

  if (input.feedUrl) {
    const { data: existing, error: existingError } = await supabase
      .from("sources")
      .select("*")
      .eq("feed_url", input.feedUrl)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from("sources")
        .update(sourceUpdate(input))
        .eq("id", (existing as SourceRow).id)
        .select("*")
        .single();

      if (updateError) throw updateError;
      return mapSource(updated as SourceRow);
    }
  }

  const { data, error } = await supabase
    .from("sources")
    .insert({
      name: input.name,
      homepage_url: input.homepageUrl ?? null,
      feed_url: input.feedUrl ?? null,
      source_type: input.sourceType ?? "manual",
      credibility_score: input.credibilityScore ?? null,
      political_or_editorial_label: input.politicalOrEditorialLabel ?? null,
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
      homepageUrl: feed.homepageUrl,
      feedUrl: feed.feedUrl,
      sourceType: feed.sourceType,
      credibilityScore: feed.credibilityScore,
      politicalOrEditorialLabel: feed.editorialLabel,
      active: feed.enabled,
    });
    sources.push(source);
  }

  return sources;
}
