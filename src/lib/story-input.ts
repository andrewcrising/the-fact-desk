import { slugify } from "@/lib/slug";
import {
  asBoolean,
  asCategory,
  asConfidence,
  asEvidenceLevel,
  asNumber,
  asOptionalString,
  asSignal,
  asString,
  asStringArray,
  isRecord,
} from "@/lib/validation";
import type {
  StoryInput,
  StorySourceInput,
  StoryUpdateInput,
} from "@/types/editorial";

function parseSourceAttachments(value: unknown): StorySourceInput[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const sources: StorySourceInput[] = [];

  for (const item of value) {
    if (!isRecord(item)) continue;

    const sourceName = asString(item.sourceName);
    const url = asString(item.url);
    if (!sourceName || !url) continue;

    sources.push({
      sourceId: asString(item.sourceId),
      sourceName,
      url,
      title: asString(item.title),
      feedItemId: asOptionalString(item.feedItemId),
      publishedAt: asOptionalString(item.publishedAt),
    });
  }

  return sources;
}

export function parseStoryInput(body: unknown): StoryInput {
  if (!isRecord(body)) throw new Error("Request body must be an object");

  const title = asString(body.title);
  const summary = asString(body.summary);
  const whatHappened = asString(body.whatHappened);
  const whyItMatters = asString(body.whyItMatters);
  const category = asCategory(body.category);
  const signal = asSignal(body.signal);
  const confidence = asConfidence(body.confidence);
  const evidenceLevel = asEvidenceLevel(body.evidenceLevel) ?? "Moderate";

  if (!title || !summary || !whatHappened || !whyItMatters) {
    throw new Error("title, summary, whatHappened, and whyItMatters are required");
  }
  if (!category || !signal || !confidence) {
    throw new Error("category, signal, and confidence are required");
  }

  return {
    title,
    slug: asString(body.slug) ? slugify(asString(body.slug)!) : undefined,
    summary,
    whatHappened,
    whyItMatters,
    coverageAngle: asOptionalString(body.coverageAngle),
    uncertaintyNote: asOptionalString(body.uncertaintyNote),
    category,
    signal,
    confidence,
    evidenceLevel,
    status: body.status === "published" ? "published" : "draft",
    homepageRank: asNumber(body.homepageRank),
    isLead: asBoolean(body.isLead) ?? false,
    tags: asStringArray(body.tags) ?? [],
    sourceAttachments: parseSourceAttachments(body.sourceAttachments) ?? [],
  };
}

export function parseStoryUpdateInput(body: unknown): StoryUpdateInput {
  if (!isRecord(body)) throw new Error("Request body must be an object");

  const input: StoryUpdateInput = {};
  const title = asString(body.title);
  const summary = asString(body.summary);
  const whatHappened = asString(body.whatHappened);
  const whyItMatters = asString(body.whyItMatters);
  const category = asCategory(body.category);
  const signal = asSignal(body.signal);
  const confidence = asConfidence(body.confidence);
  const evidenceLevel = asEvidenceLevel(body.evidenceLevel);

  if (title) input.title = title;
  if (asString(body.slug)) input.slug = slugify(asString(body.slug)!);
  if (summary) input.summary = summary;
  if (whatHappened) input.whatHappened = whatHappened;
  if (whyItMatters) input.whyItMatters = whyItMatters;
  if ("coverageAngle" in body) input.coverageAngle = asOptionalString(body.coverageAngle);
  if ("uncertaintyNote" in body) input.uncertaintyNote = asOptionalString(body.uncertaintyNote);
  if (category) input.category = category;
  if (signal) input.signal = signal;
  if (confidence) input.confidence = confidence;
  if (evidenceLevel) input.evidenceLevel = evidenceLevel;
  if (body.status === "draft" || body.status === "archived" || body.status === "corrected") {
    input.status = body.status;
  } else if (body.status === "published") {
    throw new Error("Use the publish action to publish stories.");
  }
  if ("homepageRank" in body) input.homepageRank = asNumber(body.homepageRank);
  if ("isLead" in body) input.isLead = asBoolean(body.isLead) ?? false;
  if ("tags" in body) input.tags = asStringArray(body.tags) ?? [];
  if ("sourceAttachments" in body) {
    input.sourceAttachments = parseSourceAttachments(body.sourceAttachments) ?? [];
  }

  return input;
}
