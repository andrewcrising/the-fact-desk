/**
 * Parallel, failure-isolated publisher/primary RSS ingestion plus an opt-in
 * social discovery lane. Social signals may join clusters but never count as
 * independent publisher corroboration.
 */
import { getEnabledFeeds } from "@/data/rssFeeds";
import { clusterAndBalanceStories } from "@/lib/ingest/cluster-stories";
import { fetchRssStories } from "@/lib/ingest/rss";
import {
  ingestSocialSignalsWithDiagnostics,
  socialSignalToStory,
} from "@/lib/ingest/social-signal";
import {
  independentEvidenceSourceCount,
  isSocialOnlyStory,
} from "@/lib/stories";
import {
  countStoriesByViewpoint,
  getSourceViewpoint,
  type ViewpointBand,
} from "@/lib/viewpoints";
import type { Story } from "@/types/story";
import type { SocialPlatform } from "@/types/social-signal";

const PER_FEED_LIMIT = 3;
const FETCH_CONCURRENCY = 24;
const FEED_TIMEOUT_MS = 5500;
const SOCIAL_STORY_LIMIT = 8;

export interface FeedIngestDiagnostics {
  stories: Story[];
  feedsChecked: number;
  feedsWithStories: number;
  activeSourceCount: number;
  activeSources: string[];
  rawStoryCount: number;
  multiSourceStoryCount: number;
  failedFeedIds: string[];
  emptyFeedIds: string[];
  activeSourceViewpointCounts: Record<ViewpointBand, number>;
  storyViewpointCounts: Record<ViewpointBand, number>;
  socialSourcesChecked: number;
  socialSourcesWithSignals: number;
  socialSignalCount: number;
  socialFailedSourceIds: string[];
  socialProviderCounts: Partial<Record<SocialPlatform, number>>;
}

interface FeedResult {
  id: string;
  sourceName: string;
  stories: Story[];
  status: "ok" | "empty" | "failed";
}

async function fetchFeed(
  feed: ReturnType<typeof getEnabledFeeds>[number],
): Promise<FeedResult> {
  try {
    const stories = await fetchRssStories(feed.feedUrl, {
      sourceName: feed.sourceName,
      category: feed.category,
      signal: feed.signal,
      limit: PER_FEED_LIMIT,
      timeoutMs: FEED_TIMEOUT_MS,
      strict: true,
      viewpoint: getSourceViewpoint(feed.sourceName),
    });
    return {
      id: feed.id,
      sourceName: feed.sourceName,
      stories,
      status: stories.length > 0 ? "ok" : "empty",
    };
  } catch {
    return {
      id: feed.id,
      sourceName: feed.sourceName,
      stories: [],
      status: "failed",
    };
  }
}

export async function ingestEnabledFeedsWithDiagnostics(): Promise<FeedIngestDiagnostics> {
  const feeds = getEnabledFeeds();
  const results: FeedResult[] = [];
  const socialPromise = ingestSocialSignalsWithDiagnostics();

  for (let index = 0; index < feeds.length; index += FETCH_CONCURRENCY) {
    const batch = feeds.slice(index, index + FETCH_CONCURRENCY);
    results.push(...(await Promise.all(batch.map(fetchFeed))));
  }

  const social = await socialPromise;
  const socialStories = social.signals
    .slice(0, SOCIAL_STORY_LIMIT)
    .map(socialSignalToStory);
  const publisherStories = results.flatMap((result) => result.stories);
  const rawStories = [...publisherStories, ...socialStories];
  const stories = clusterAndBalanceStories(rawStories);
  const activeSources = Array.from(
    new Set(
      results
        .filter((result) => result.status === "ok")
        .map((result) => result.sourceName),
    ),
  ).sort();
  const activeSourceViewpointCounts = activeSources.reduce(
    (counts, source) => {
      counts[getSourceViewpoint(source)] += 1;
      return counts;
    },
    {
      "left-of-center": 0,
      "center-mixed": 0,
      "right-of-center": 0,
      "primary-source": 0,
    } satisfies Record<ViewpointBand, number>,
  );
  const evidenceStories = stories.filter((story) => !isSocialOnlyStory(story));

  return {
    stories,
    feedsChecked: feeds.length,
    feedsWithStories: results.filter((result) => result.status === "ok").length,
    activeSourceCount: activeSources.length,
    activeSources,
    rawStoryCount: rawStories.length,
    multiSourceStoryCount: stories.filter(
      (story) => independentEvidenceSourceCount(story) >= 2,
    ).length,
    failedFeedIds: results
      .filter((result) => result.status === "failed")
      .map((result) => result.id),
    emptyFeedIds: results
      .filter((result) => result.status === "empty")
      .map((result) => result.id),
    activeSourceViewpointCounts,
    storyViewpointCounts: countStoriesByViewpoint(evidenceStories),
    socialSourcesChecked: social.sourcesChecked,
    socialSourcesWithSignals: social.sourcesWithSignals,
    socialSignalCount: social.signals.length,
    socialFailedSourceIds: social.failedSourceIds,
    socialProviderCounts: social.providerCounts,
  };
}

export async function ingestEnabledFeeds(): Promise<Story[]> {
  return (await ingestEnabledFeedsWithDiagnostics()).stories;
}
