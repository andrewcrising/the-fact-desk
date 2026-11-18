import { getEvidenceAssistForStory } from "@/lib/evidence-assist-repository";
import type { EvidenceProfile } from "@/lib/evidence-scoring";
import {
  getEditorialAiProvider,
  type AiProvider,
  type AiProviderMessage,
} from "@/lib/ai/provider";
import { requireSupabaseAdmin } from "@/lib/supabase";
import { getStoryById } from "@/lib/story-repository";
import type { SourceType } from "@/types/editorial";
import type { PersistedStory } from "@/types/editorial";

export interface DraftAssistSourceContext {
  title: string;
  source_name: string;
  source_type: SourceType | string | null;
  url: string;
  published_at: string | null;
  excerpt: string | null;
}

export interface DraftAssistContext {
  story: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    what_happened: string;
    why_it_matters: string;
    coverage_angle: string | null;
    category: string;
    signal: string;
    confidence: string;
    evidence_level: string | null;
    uncertainty_note: string | null;
    tags: string[];
  };
  attached_sources: DraftAssistSourceContext[];
  related_feed_items: DraftAssistSourceContext[];
  evidence_assist: EvidenceProfile;
}

export interface AiDraftAssistOutput {
  suggested_title: string;
  suggested_summary: string;
  suggested_what_happened: string;
  suggested_why_it_matters: string;
  suggested_coverage_angle: string;
  suggested_uncertainty_note: string;
  confidence_rationale: string;
  source_spread_explanation: string;
  editorial_warnings: string[];
  claims_to_verify: string[];
  metadata_limitations: string[];
}

interface DraftAssistSourceRow {
  title: string;
  url: string;
  source_name: string;
  published_at: string | null;
  sources?:
    | { name: string | null; source_type: SourceType | string | null }
    | Array<{ name: string | null; source_type: SourceType | string | null }>
    | null;
  feed_items?:
    | {
        title: string | null;
        canonical_url: string | null;
        published_at: string | null;
        summary: string | null;
      }
    | Array<{
        title: string | null;
        canonical_url: string | null;
        published_at: string | null;
        summary: string | null;
      }>
    | null;
}

function firstJoined<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function persistedStoryToPromptStory(story: PersistedStory) {
  return {
    id: story.id,
    title: story.title,
    slug: story.slug,
    summary: story.summary,
    what_happened: story.whatHappened,
    why_it_matters: story.whyItMatters,
    coverage_angle: story.coverageAngle ?? null,
    category: story.category,
    signal: story.signal,
    confidence: story.confidence,
    evidence_level: story.evidenceLevel ?? null,
    uncertainty_note: story.uncertaintyNote ?? null,
    tags: story.tags,
  };
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function validateDraftAssistOutput(value: unknown): AiDraftAssistOutput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("AI Draft Assist returned invalid JSON shape.");
  }

  const record = value as Record<string, unknown>;
  return {
    suggested_title: asString(record.suggested_title),
    suggested_summary: asString(record.suggested_summary),
    suggested_what_happened: asString(record.suggested_what_happened),
    suggested_why_it_matters: asString(record.suggested_why_it_matters),
    suggested_coverage_angle: asString(record.suggested_coverage_angle),
    suggested_uncertainty_note: asString(record.suggested_uncertainty_note),
    confidence_rationale: asString(record.confidence_rationale),
    source_spread_explanation: asString(record.source_spread_explanation),
    editorial_warnings: asStringArray(record.editorial_warnings),
    claims_to_verify: asStringArray(record.claims_to_verify),
    metadata_limitations: asStringArray(record.metadata_limitations),
  };
}

export function parseDraftAssistResponse(raw: string): AiDraftAssistOutput {
  try {
    return validateDraftAssistOutput(JSON.parse(raw));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("AI Draft Assist returned invalid JSON.");
    }
    throw error;
  }
}

export function buildDraftAssistMessages(
  context: DraftAssistContext,
): AiProviderMessage[] {
  const system = [
    "You are assisting an editor at The Fact Desk.",
    "Write calm, neutral, evidence-ranked briefing copy.",
    "Use only the provided story, source, feed item metadata, excerpts, and Evidence Assist profile.",
    "Do not invent facts, quotes, source names, URLs, citations, or claims.",
    "Do not claim something is confirmed unless the source posture supports it.",
    "Preserve uncertainty. If evidence is weak, say so.",
    "If information is metadata-limited, say so in metadata_limitations and draft cautiously.",
    "Avoid partisan framing, outrage language, hype, and clickbait.",
    "For Health Desk items, do not write medical advice; frame as public health, research, policy, or safety signals.",
    "Output valid JSON only using exactly these keys: suggested_title, suggested_summary, suggested_what_happened, suggested_why_it_matters, suggested_coverage_angle, suggested_uncertainty_note, confidence_rationale, source_spread_explanation, editorial_warnings, claims_to_verify, metadata_limitations.",
  ].join(" ");

  return [
    { role: "system", content: system },
    {
      role: "user",
      content: JSON.stringify(
        {
          task: "Generate human-reviewed editorial draft suggestions. Do not publish or mutate story fields.",
          context,
        },
        null,
        2,
      ),
    },
  ];
}

export async function getDraftAssistContextForStory(
  storyId: string,
): Promise<DraftAssistContext> {
  const story = await getStoryById(storyId);
  if (!story) throw new Error("Story not found");

  const evidenceAssist = await getEvidenceAssistForStory(storyId);
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("story_sources")
    .select("title,url,source_name,published_at,sources(name,source_type),feed_items(title,canonical_url,published_at,summary)")
    .eq("story_id", storyId);

  if (error) throw error;

  const rows = (data ?? []) as unknown as DraftAssistSourceRow[];
  const attachedSources = rows.map((row) => {
    const source = firstJoined(row.sources);
    return {
      title: row.title,
      source_name: source?.name ?? row.source_name,
      source_type: source?.source_type ?? "unknown",
      url: row.url,
      published_at: row.published_at,
      excerpt: null,
    };
  });

  const relatedFeedItems: DraftAssistSourceContext[] = [];
  for (const row of rows) {
    const feedItem = firstJoined(row.feed_items);
    const source = firstJoined(row.sources);
    if (!feedItem) continue;
    relatedFeedItems.push({
        title: feedItem.title ?? row.title,
        source_name: source?.name ?? row.source_name,
        source_type: source?.source_type ?? "unknown",
        url: feedItem.canonical_url ?? row.url,
        published_at: feedItem.published_at ?? row.published_at,
        excerpt: feedItem.summary,
    });
  }

  return {
    story: persistedStoryToPromptStory(story),
    attached_sources: attachedSources,
    related_feed_items: relatedFeedItems,
    evidence_assist: evidenceAssist,
  };
}

export async function generateEditorialDraftAssist(
  context: DraftAssistContext,
  provider: AiProvider = getEditorialAiProvider(),
): Promise<AiDraftAssistOutput> {
  const raw = await provider.generateJson(buildDraftAssistMessages(context));
  return parseDraftAssistResponse(raw);
}
