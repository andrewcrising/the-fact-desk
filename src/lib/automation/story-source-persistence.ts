import { getOrCreateSource } from "@/lib/source-repository";
import { requireSupabaseAdmin } from "@/lib/supabase";
import { getStoryById } from "@/lib/story-repository";
import { urlOrigin } from "@/lib/url";
import type {
  PersistedStory,
  StorySourceInput,
} from "@/types/editorial";

interface ResolvedAttachment {
  sourceId: string;
  sourceName: string;
  url: string;
  title: string;
  feedItemId: string | null;
  publishedAt: string | null;
}

async function resolveAttachment(
  input: StorySourceInput,
): Promise<ResolvedAttachment | null> {
  if (!input.url || !input.sourceName) return null;

  const source = input.sourceId
    ? { id: input.sourceId }
    : await getOrCreateSource({
        name: input.sourceName,
        homepageUrl: urlOrigin(input.url),
        sourceType: "manual",
      });

  return {
    sourceId: source.id,
    sourceName: input.sourceName,
    url: input.url,
    title: input.title ?? input.url,
    feedItemId: input.feedItemId ?? null,
    publishedAt: input.publishedAt ?? null,
  };
}

/**
 * Automation must accumulate evidence, not implement a replace-all edit.
 * Resolve every source first, then upsert by the story/url uniqueness contract.
 * Existing attachments are never deleted here, so a partial upstream failure
 * cannot erase evidence gathered on an earlier run.
 */
export async function upsertAccumulatedStorySources(
  storyId: string,
  inputs: StorySourceInput[],
): Promise<PersistedStory> {
  const resolved = (
    await Promise.all(inputs.map((input) => resolveAttachment(input)))
  ).filter((item): item is ResolvedAttachment => Boolean(item));

  const supabase = requireSupabaseAdmin();
  for (const attachment of resolved) {
    const { error } = await supabase.from("story_sources").upsert(
      {
        story_id: storyId,
        source_id: attachment.sourceId,
        feed_item_id: attachment.feedItemId,
        url: attachment.url,
        title: attachment.title,
        source_name: attachment.sourceName,
        published_at: attachment.publishedAt,
      },
      { onConflict: "story_id,url" },
    );
    if (error) throw error;
  }

  const story = await getStoryById(storyId);
  if (!story) throw new Error("Story not found after accumulating sources.");
  return story;
}
