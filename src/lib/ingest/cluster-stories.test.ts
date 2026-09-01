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

test("multi-source cluster receives an independent Fact Desk headline", () => {
  const publishedAt = "2026-09-01T10:00:00.000Z";
  const sourceA = story(
    "source-a",
    "First Thing: Duane Carter faces renewed scrutiny after federal filing",
    "Publisher A",
    publishedAt,
  );
  const sourceB = story(
    "source-b",
    "Federal filing brings renewed scrutiny for Duane Carter",
    "Publisher B",
    publishedAt,
  );

  const clustered = clusterAndBalanceStories([sourceA, sourceB]);
  const merged = clustered.find((item) => item.sources.length === 2);

  assert.ok(merged);
  assert.notEqual(merged.title, sourceA.title);
  assert.notEqual(merged.title, sourceB.title);
  assert.match(merged.title, /^World briefing:/);
  assert.match(merged.title, /Duane|Carter|federal|filing|scrutiny/i);
  assert.doesNotMatch(merged.title, /First Thing/i);
  assert.match(
    merged.coverageAngle ?? "",
    /independently synthesized from shared headline terms/i,
  );
});
