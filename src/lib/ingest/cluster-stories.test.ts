import assert from "node:assert/strict";
import test from "node:test";

import { clusterAndBalanceStories } from "@/lib/ingest/cluster-stories";
import type { Story } from "@/types/story";

function story(
  id: string,
  title: string,
  source: string,
  publishedAt: string,
): Story {
  return {
    id,
    slug: id,
    title,
    summary: `${title} summary`,
    whatHappened: title,
    whyItMatters: `${title} matters`,
    category: "World",
    confidence: "Single-source",
    signal: "Developing",
    sources: [source],
    sourceUrls: [`https://example.com/${id}`],
    publishedAt,
    updatedAt: publishedAt,
    tags: ["live-rss"],
  };
}

test("does not let a bridge headline merge otherwise unrelated clusters", () => {
  const publishedAt = "2026-08-31T22:00:00.000Z";
  const first = story(
    "first",
    "Alpha Beta Gamma Delta Epsilon Theta Iota",
    "Source A",
    publishedAt,
  );
  const bridge = story(
    "bridge",
    "Alpha Beta Gamma Delta Lambda Muon Nuon",
    "Source B",
    publishedAt,
  );
  const unrelatedTail = story(
    "tail",
    "Delta Lambda Muon Nuon Xiom Omicron Piom",
    "Source C",
    publishedAt,
  );

  const clustered = clusterAndBalanceStories([first, bridge, unrelatedTail]);

  assert.equal(clustered.length, 2);
  assert.ok(clustered.some((item) => item.sources.length === 2));
  assert.ok(clustered.some((item) => item.sources.length === 1));
  assert.ok(clustered.every((item) => item.sources.length < 3));
});
