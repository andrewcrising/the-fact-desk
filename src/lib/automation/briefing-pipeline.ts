import {
  canRunAutomationDrafting,
  canRunGuardedAutoPublish,
  getAutomationMode,
  isHealthAutoPublishEnabled,
} from "@/lib/automation/config";
import {
  completeAutomationRun,
  createAutomationRun,
  createStoryAutomationEvent,
} from "@/lib/automation/automation-repository";
import { evaluateGuardedPublish } from "@/lib/automation/publish-policy";
import {
  clusterFeedItems,
  type ClusterableFeedItem,
  type StoryCluster,
} from "@/lib/automation/story-clustering";
import { generateEditorialDraftAssist } from "@/lib/ai/editorial-draft-assist";
import { isAiDraftAssistConfigured } from "@/lib/ai/provider";
import { getEvidenceAssistForStory } from "@/lib/evidence-assist-repository";
import {
  countFeedItemsByStatus,
  ingestConfiguredRssFeeds,
  listFeedItems,
  updateFeedItemStatus,
} from "@/lib/feed-repository";
import { requireSupabaseAdmin } from "@/lib/supabase";
import {
  createStory,
  getStoryById,
  publishStory,
  replaceStorySources,
  updateStory,
} from "@/lib/story-repository";
import { slugWithSuffix } from "@/lib/slug";
import type { AutomationMode, FeedItem, PersistedStory } from "@/types/editorial";
import type { Confidence, EvidenceLevel, Signal, StoryCategory } from "@/types/story";

export interface BriefingPipelineReport {
  mode: AutomationMode;
  dry_run: boolean;
  feeds_checked: number;
  feed_items_seen: number;
  new_feed_items: number;
  duplicates_skipped: number;
  clusters_created: number;
  drafts_created: number;
  drafts_updated: number;
  stories_auto_published: number;
  stories_needing_review: number;
  errors: Array<{ stage: string; message: string }>;
  warnings: string[];
}

export interface RunBriefingPipelineOptions {
  dryRun?: boolean;
  mode?: AutomationMode;
}

interface StorySourceAttachment {
  sourceName: string;
  url: string;
  title: string;
  feedItemId: string;
  publishedAt: string | null;
}

function emptyReport(mode: AutomationMode, dryRun: boolean): BriefingPipelineReport {
  return {
    mode,
    dry_run: dryRun,
    feeds_checked: 0,
    feed_items_seen: 0,
    new_feed_items: 0,
    duplicates_skipped: 0,
    clusters_created: 0,
    drafts_created: 0,
    drafts_updated: 0,
    stories_auto_published: 0,
    stories_needing_review: 0,
    errors: [],
    warnings: [],
  };
}

function feedItemToClusterable(item: FeedItem): ClusterableFeedItem {
  return {
    id: item.id,
    title: item.title,
    canonicalUrl: item.canonicalUrl,
    sourceName: item.sourceName,
    publishedAt: item.publishedAt,
    summary: item.summary,
  };
}

function attachmentsForCluster(
  cluster: StoryCluster,
  feedItems: FeedItem[],
): StorySourceAttachment[] {
  const itemById = new Map(feedItems.map((item) => [item.id, item]));
  return cluster.feed_item_ids
    .map((id) => itemById.get(id))
    .filter((item): item is FeedItem => Boolean(item))
    .map((item) => ({
      sourceName: item.sourceName ?? "RSS",
      url: item.canonicalUrl,
      title: item.title,
      feedItemId: item.id,
      publishedAt: item.publishedAt,
    }));
}

function likelyCategory(cluster: StoryCluster): StoryCategory {
  return cluster.likely_category === "Unknown" ? "World" : cluster.likely_category;
}

function initialDraftFields(cluster: StoryCluster, feedItems: FeedItem[]) {
  const items = cluster.feed_item_ids
    .map((id) => feedItems.find((item) => item.id === id))
    .filter((item): item is FeedItem => Boolean(item));
  const summaries = items
    .map((item) => item.summary)
    .filter((summary): summary is string => Boolean(summary));
  const sourceNames = Array.from(new Set(items.map((item) => item.sourceName ?? "RSS")));
  const sourcePhrase = sourceNames.slice(0, 4).join(", ");
  const summary =
    summaries[0] ??
    `Developing source signal from ${sourcePhrase || "monitored feeds"}.`;

  return {
    title: cluster.representative_title,
    slug: slugWithSuffix(cluster.representative_title),
    summary,
    whatHappened:
      summaries.length > 0
        ? `${cluster.representative_title}. ${summaries.slice(0, 2).join(" ")}`
        : `${cluster.representative_title}. Monitored sources are reporting related updates; source review is required before stronger wording.`,
    whyItMatters:
      "This automated draft needs editorial review to assess public relevance, source quality, and whether the signal is under-covered.",
    coverageAngle: `Automated cluster from ${items.length} feed item${
      items.length === 1 ? "" : "s"
    } across ${cluster.unique_domains.length} source domain${
      cluster.unique_domains.length === 1 ? "" : "s"
    }.`,
    uncertaintyNote:
      "Automated draft based on feed metadata and snippets. Verify source content, claims, and context before publication.",
  };
}

async function findExistingStoryForCluster(cluster: StoryCluster): Promise<string | null> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("story_sources")
    .select("story_id")
    .in("feed_item_id", cluster.feed_item_ids)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.story_id as string | undefined) ?? null;
}

async function createOrUpdateDraftFromCluster(
  cluster: StoryCluster,
  feedItems: FeedItem[],
  mode: AutomationMode,
): Promise<{ story: PersistedStory; created: boolean; updated: boolean }> {
  const existingStoryId = await findExistingStoryForCluster(cluster);
  const attachments = attachmentsForCluster(cluster, feedItems);
  const draftFields = initialDraftFields(cluster, feedItems);

  if (existingStoryId) {
    const story = await replaceStorySources(existingStoryId, attachments);
    return { story, created: false, updated: true };
  }

  const story = await createStory({
    ...draftFields,
    category: likelyCategory(cluster),
    signal: cluster.source_count <= 2 ? "Under-covered" : "Developing",
    confidence: "Single-source",
    evidenceLevel: "Low",
    status: "draft",
    tags: ["automated-draft", `cluster-${cluster.cluster_id}`],
    sourceAttachments: attachments,
  });

  await createStoryAutomationEvent({
    storyId: story.id,
    eventType: "draft_created",
    mode,
    details: { cluster },
  });

  return { story, created: true, updated: false };
}

async function applyEvidenceSuggestions(story: PersistedStory): Promise<PersistedStory> {
  const profile = await getEvidenceAssistForStory(story.id);
  return updateStory(story.id, {
    evidenceLevel: profile.suggested_evidence_level,
    confidence: profile.suggested_confidence,
    signal:
      profile.coverage_status_suggestion === "under-covered"
        ? "Under-covered"
        : story.signal,
    uncertaintyNote:
      story.uncertaintyNote || profile.uncertainty_note_suggestion || undefined,
  });
}

async function maybeApplyAiDraft(story: PersistedStory): Promise<PersistedStory> {
  if (!isAiDraftAssistConfigured()) return story;

  try {
    const profile = await getEvidenceAssistForStory(story.id);
    const output = await generateEditorialDraftAssist({
      story: {
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
      },
      attached_sources: story.storySources.map((source) => ({
        title: source.title,
        source_name: source.sourceName,
        source_type: "unknown",
        url: source.url,
        published_at: source.publishedAt,
        excerpt: null,
      })),
      related_feed_items: [],
      evidence_assist: profile,
    });

    if (output.claims_to_verify.length > 0) return story;

    return updateStory(story.id, {
      summary: output.suggested_summary || story.summary,
      whatHappened: output.suggested_what_happened || story.whatHappened,
      whyItMatters: output.suggested_why_it_matters || story.whyItMatters,
      coverageAngle: output.suggested_coverage_angle || story.coverageAngle,
      uncertaintyNote: output.suggested_uncertainty_note || story.uncertaintyNote,
    });
  } catch {
    return story;
  }
}

async function processCluster(input: {
  cluster: StoryCluster;
  feedItems: FeedItem[];
  mode: AutomationMode;
  dryRun: boolean;
  report: BriefingPipelineReport;
}) {
  if (input.dryRun) {
    input.report.stories_needing_review += 1;
    return;
  }

  const result = await createOrUpdateDraftFromCluster(
    input.cluster,
    input.feedItems,
    input.mode,
  );
  input.report.drafts_created += result.created ? 1 : 0;
  input.report.drafts_updated += result.updated ? 1 : 0;

  let story = await applyEvidenceSuggestions(result.story);
  if (canRunAutomationDrafting(input.mode)) {
    story = await maybeApplyAiDraft(story);
  }

  for (const feedItemId of input.cluster.feed_item_ids) {
    await updateFeedItemStatus(feedItemId, "promoted");
  }

  const evidenceProfile = await getEvidenceAssistForStory(story.id);
  const decision = evaluateGuardedPublish({
    mode: input.mode,
    story: {
      category: story.category,
      signal: story.signal,
      confidence: story.confidence,
      evidenceLevel: story.evidenceLevel,
      summary: story.summary,
      whatHappened: story.whatHappened,
      whyItMatters: story.whyItMatters,
      uncertaintyNote: story.uncertaintyNote,
    },
    evidenceProfile,
    healthAutoPublishEnabled: isHealthAutoPublishEnabled(),
  });

  if (canRunGuardedAutoPublish(input.mode) && decision.canPublish) {
    await publishStory(story.id, { isLead: false, homepageRank: null });
    input.report.stories_auto_published += 1;
    await createStoryAutomationEvent({
      storyId: story.id,
      eventType: "auto_published",
      mode: input.mode,
      details: { decision },
    });
  } else {
    input.report.stories_needing_review += 1;
    if (decision.reasons.length > 0) {
      input.report.warnings.push(
        `Story ${story.slug} needs review: ${decision.reasons.join("; ")}`,
      );
    }
  }
}

export async function runBriefingPipeline(
  options: RunBriefingPipelineOptions = {},
): Promise<BriefingPipelineReport> {
  const mode = options.mode ?? getAutomationMode();
  const dryRun = options.dryRun ?? false;
  const report = emptyReport(mode, dryRun);
  let runId: string | null = null;

  if (!dryRun) {
    runId = await createAutomationRun(mode);
  }

  try {
    const beforeNewCount = dryRun ? 0 : await countFeedItemsByStatus("new");
    if (dryRun) {
      report.warnings.push("Dry run uses existing feed items and does not fetch or write new RSS data.");
    } else {
      const ingest = await ingestConfiguredRssFeeds();
      report.feeds_checked = ingest.feedsChecked;
      report.feed_items_seen = ingest.itemsFound;
      report.new_feed_items = ingest.newItemsInserted;
      report.duplicates_skipped = ingest.duplicatesSkipped;
      report.errors.push(
        ...ingest.errors.map((error) => ({
          stage: "ingest",
          message: `${error.feedUrl}: ${error.message}`,
        })),
      );
    }

    const feedItems = await listFeedItems({ status: "new", limit: 100 });
    if (dryRun) {
      report.feed_items_seen = feedItems.length;
      report.new_feed_items = beforeNewCount;
    }

    const clusters = clusterFeedItems(feedItems.map(feedItemToClusterable));
    report.clusters_created = clusters.length;

    if (mode === "manual_review") {
      report.stories_needing_review = clusters.length;
      report.warnings.push("manual_review mode does not create drafts or publish stories.");
    } else {
      for (const cluster of clusters) {
        try {
          await processCluster({ cluster, feedItems, mode, dryRun, report });
        } catch (error) {
          report.errors.push({
            stage: "cluster",
            message: error instanceof Error ? error.message : "Unknown cluster error",
          });
        }
      }
    }

    if (runId) {
      await completeAutomationRun(runId, {
        status: report.errors.length > 0 ? "failed" : "completed",
        feeds_checked: report.feeds_checked,
        new_feed_items: report.new_feed_items,
        clusters_created: report.clusters_created,
        drafts_created: report.drafts_created,
        drafts_updated: report.drafts_updated,
        stories_auto_published: report.stories_auto_published,
        stories_needing_review: report.stories_needing_review,
        errors: report.errors,
        warnings: report.warnings,
      });
    }

    return report;
  } catch (error) {
    report.errors.push({
      stage: "pipeline",
      message: error instanceof Error ? error.message : "Unknown pipeline error",
    });
    if (runId) {
      await completeAutomationRun(runId, {
        status: "failed",
        feeds_checked: report.feeds_checked,
        new_feed_items: report.new_feed_items,
        clusters_created: report.clusters_created,
        drafts_created: report.drafts_created,
        drafts_updated: report.drafts_updated,
        stories_auto_published: report.stories_auto_published,
        stories_needing_review: report.stories_needing_review,
        errors: report.errors,
        warnings: report.warnings,
      });
    }
    return report;
  }
}
