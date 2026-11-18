import {
  calculateEvidenceProfile,
  type EvidenceAssistSource,
  type EvidenceProfile,
} from "@/lib/evidence-scoring";
import { requireSupabaseAdmin } from "@/lib/supabase";
import { getStoryById } from "@/lib/story-repository";
import type { SourceType } from "@/types/editorial";

interface StorySourceAssistRow {
  source_id: string | null;
  feed_item_id: string | null;
  url: string;
  source_name: string;
  sources?:
    | {
        source_type: SourceType | string | null;
        name: string | null;
      }
    | Array<{
        source_type: SourceType | string | null;
        name: string | null;
      }>
    | null;
  feed_items?:
    | {
        status: string | null;
      }
    | Array<{
        status: string | null;
      }>
    | null;
}

function firstJoined<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getEvidenceAssistForStory(
  storyId: string,
): Promise<EvidenceProfile> {
  const story = await getStoryById(storyId);
  if (!story) throw new Error("Story not found");

  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("story_sources")
    .select("source_id,feed_item_id,url,source_name,sources(source_type,name),feed_items(status)")
    .eq("story_id", storyId);

  if (error) throw error;

  const sources: EvidenceAssistSource[] = ((data ?? []) as unknown as StorySourceAssistRow[]).map(
    (row) => {
      const source = firstJoined(row.sources);
      const feedItem = firstJoined(row.feed_items);
      return {
      source_id: row.source_id,
      source_name: source?.name ?? row.source_name,
      url: row.url,
      source_type: source?.source_type ?? "unknown",
      feed_item_status: feedItem?.status ?? null,
    };
    },
  );

  return calculateEvidenceProfile({
    story: {
      category: story.category,
      signal: story.signal,
      confidence: story.confidence,
      evidence_level: story.evidenceLevel,
      tags: story.tags,
      uncertainty_note: story.uncertaintyNote,
    },
    sources,
  });
}
