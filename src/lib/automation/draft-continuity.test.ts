import assert from "node:assert/strict";
import test from "node:test";
import { selectContinuingDraft } from "./draft-continuity";
import type { StoryCluster } from "./story-clustering";

function cluster(overrides: Partial<StoryCluster> = {}): StoryCluster {
  return {
    cluster_id: "cluster-1",
    representative_title: "CISA warns of critical Microsoft Exchange vulnerability",
    feed_item_ids: ["feed-1"],
    source_count: 1,
    unique_domains: ["cisa.gov"],
    likely_category: "Technology",
    confidence: "low",
    ...overrides,
  };
}

test("continues a strongly matching draft in the same category", () => {
  const match = selectContinuingDraft(cluster(), [
    {
      id: "draft-1",
      title: "Critical Microsoft Exchange vulnerability draws CISA warning",
      category: "Technology",
      updatedAt: "2026-08-25T10:00:00.000Z",
    },
  ]);

  assert.equal(match?.id, "draft-1");
});

test("does not merge a similar title from a different category", () => {
  const match = selectContinuingDraft(cluster(), [
    {
      id: "draft-1",
      title: "Critical Microsoft Exchange vulnerability draws CISA warning",
      category: "World",
    },
  ]);

  assert.equal(match, null);
});

test("unknown-category clusters never merge across runs", () => {
  const match = selectContinuingDraft(cluster({ likely_category: "Unknown" }), [
    {
      id: "draft-1",
      title: "CISA warns of critical Microsoft Exchange vulnerability",
      category: "Technology",
    },
  ]);

  assert.equal(match, null);
});

test("weak one-term overlap is not enough to merge distinct stories", () => {
  const match = selectContinuingDraft(cluster(), [
    {
      id: "draft-1",
      title: "Microsoft launches redesigned consumer subscription bundle",
      category: "Technology",
    },
  ]);

  assert.equal(match, null);
});
