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
  const publishedAt = new Date().toISOString();
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

test("merged citations retain source order when a publisher has no URL", () => {
  const now = new Date().toISOString();
  const title = "Agency Reports Major Regional Transport Service Interruption";
  const first = story("citation-first", title, "Publisher A", now);
  const second = { ...story("citation-second", title, "Publisher B", now), sourceUrls: [] };
  const third = story("citation-third", title, "Publisher C", now);
  const merged = clusterAndBalanceStories([first, second, third]);
  assert.equal(merged.length, 1);
  const item = merged[0];
  assert.equal(item.sources.length, 3);
  assert.deepEqual(item.sources.map((source, index) => [source, item.sourceUrls?.[index]]), [
    ["Publisher A", "https://example.com/citation-first"],
    ["Publisher B", ""],
    ["Publisher C", "https://example.com/citation-third"],
  ]);
});

test("unresolved disputed confidence survives merging", () => {
  const now = new Date().toISOString();
  const title = "Agency Reports Major Regional Transport Service Interruption";
  const disputed = { ...story("disputed-a", title, "Publisher A", now), confidence: "Disputed" as const };
  const other = story("disputed-b", title, "Publisher B", now);
  const merged = clusterAndBalanceStories([disputed, other]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.confidence, "Disputed");
});

test("merged verified origins remain aligned with their actual publishers", () => {
  const now = new Date().toISOString();
  const title = "Agency Reports Major Regional Transport Service Interruption";
  const a = { ...story("origin-a", title, "Publisher A", now), verifiedIndependentOrigins: ["original-a"] };
  const b = { ...story("origin-b", title, "Publisher B", now), verifiedIndependentOrigins: ["original-b"] };
  const merged = clusterAndBalanceStories([a, b]);
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0].sources.map((name, i) => [name, merged[0].verifiedIndependentOrigins?.[i]]), [
    ["Publisher A", "original-a"],
    ["Publisher B", "original-b"],
  ]);
});

test("unverified source cannot inherit representative verified origin", () => {
  const now = new Date().toISOString();
  const title = "Agency Reports Major Regional Transport Service Interruption";
  const a = { ...story("verified", title, "Publisher A", now), verifiedIndependentOrigins: ["original-a"] };
  const b = story("unverified", title, "Publisher B", now);
  const merged = clusterAndBalanceStories([a, b]);
  assert.deepEqual(merged[0].sources.map((name, i) => [name, merged[0].verifiedIndependentOrigins?.[i]]), [
    ["Publisher A", "original-a"],
    ["Publisher B", null],
  ]);
});

test("conflicting origin for repeated publisher is not considered verified", () => {
  const now = new Date().toISOString();
  const title = "Agency Reports Major Regional Transport Service Interruption";
  const a = { ...story("conflict-a", title, "Publisher A", now), verifiedIndependentOrigins: ["original-a"] };
  const b = { ...story("conflict-b", title, "Publisher A", now), verifiedIndependentOrigins: ["original-b"] };
  const merged = clusterAndBalanceStories([a, b]);
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0].verifiedIndependentOrigins, [null]);
});


test("rejects stories older than the production fourteen-day freshness window", () => {
  const stale = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
  const fresh = new Date().toISOString();
  const result = clusterAndBalanceStories([
    story("expired", "Expired Regional Transit Disruption", "Publisher A", stale),
    story("current", "Current Municipal Water Service Interruption", "Publisher B", fresh),
  ]);
  assert.deepEqual(result.map((item) => item.id), ["current"]);
});
