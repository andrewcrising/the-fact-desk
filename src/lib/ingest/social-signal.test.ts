import assert from "node:assert/strict";
import test from "node:test";

import { clusterAndBalanceStories } from "@/lib/ingest/cluster-stories";
import {
  socialSignalScore,
  socialSignalToStory,
} from "@/lib/ingest/social-signal";
import {
  independentEvidenceSourceCount,
  isAutomaticLeadEligible,
  isMultiSourceStory,
  isSocialOnlyStory,
  storyPriorityScore,
} from "@/lib/stories";
import type { Story } from "@/types/story";
import type { RankedSocialSignal } from "@/types/social-signal";

function socialSignal(overrides: Partial<RankedSocialSignal> = {}): RankedSocialSignal {
  const createdAt = new Date(Date.now() - 5 * 60_000).toISOString();
  return {
    id: "x-news-signal-1",
    platform: "x",
    account: "X News cluster",
    displayName: "X",
    text: "Earthquake reported near Harbor City after strong shaking across the region",
    url: "https://x.com/i/web/status/1234567890",
    createdAt,
    engagement: { likes: 100_000, reposts: 40_000, replies: 10_000, quotes: 5_000 },
    directSource: false,
    score: 100,
    reason: "Discovery signal only",
    ...overrides,
  };
}

function publisherStory(id: string, source: string): Story {
  const timestamp = new Date(Date.now() - 4 * 60_000).toISOString();
  return {
    id,
    slug: id,
    title: "Strong earthquake reported near Harbor City region",
    summary: "Officials are assessing shaking near Harbor City.",
    whatHappened: "A strong earthquake was reported near Harbor City.",
    whyItMatters: "Damage and safety assessments may change.",
    category: "World",
    confidence: "Single-source",
    signal: "Developing",
    sources: [source],
    sourceUrls: [`https://${id}.example/story`],
    sourceKinds: ["publisher"],
    publishedAt: timestamp,
    updatedAt: timestamp,
    tags: ["live-rss"],
  };
}

test("viral X-only signal remains non-lead single-source evidence", () => {
  const signal = socialSignal();
  const story = socialSignalToStory(signal);

  assert.equal(story.confidence, "Single-source");
  assert.equal(story.sourceKinds?.[0], "social");
  assert.equal(isSocialOnlyStory(story), true);
  assert.equal(independentEvidenceSourceCount(story), 0);
  assert.equal(isAutomaticLeadEligible(story), false);
  assert.ok(storyPriorityScore(story) < 45);
});

test("X discovery score is never evidence confidence", () => {
  const now = Date.now();
  const signal = socialSignal({ createdAt: new Date(now - 60_000).toISOString() });
  assert.ok(socialSignalScore(signal, now) > 0);
  const story = socialSignalToStory({ ...signal, score: 100 });
  assert.equal(story.confidence, "Single-source");
  assert.equal(isMultiSourceStory(story), false);
});

test("one publisher plus X does not become multi-source corroboration", () => {
  const publisher = publisherStory("publisher-a", "Publisher A");
  const social = socialSignalToStory(socialSignal());
  const clustered = clusterAndBalanceStories([publisher, social]);
  const merged = clustered.find((story) => story.sources.length === 2);

  assert.ok(merged);
  assert.equal(independentEvidenceSourceCount(merged), 1);
  assert.equal(merged.confidence, "Single-source");
  assert.notEqual(merged.signal, "Cross-angle");
});

test("two independent publishers can establish cross-angle with X context", () => {
  const first = publisherStory("publisher-a", "Publisher A");
  const second = publisherStory("publisher-b", "Publisher B");
  const social = socialSignalToStory(socialSignal());
  const clustered = clusterAndBalanceStories([first, second, social]);
  const merged = clustered.find((story) => story.sources.length === 3);

  assert.ok(merged);
  assert.equal(independentEvidenceSourceCount(merged), 2);
  assert.equal(merged.confidence, "Developing");
  assert.equal(merged.signal, "Cross-angle");
});
