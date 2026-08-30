import assert from "node:assert/strict";
import test from "node:test";
import type { Story } from "@/types/story";
import {
  getTopSignalStory,
  isAutomaticLeadEligible,
  isPrimaryBackedStory,
  partitionLiveStoriesByEvidence,
  uniqueSourceCount,
} from "./stories";

function story(overrides: Partial<Story> & Pick<Story, "id">): Story {
  return {
    id: overrides.id,
    slug: overrides.id,
    title: overrides.id,
    summary: "Summary",
    whatHappened: "What happened",
    whyItMatters: "Why it matters",
    category: "Politics",
    confidence: "Developing",
    signal: "Developing",
    sources: ["Example News"],
    sourceUrls: ["https://example.com/story"],
    publishedAt: "2026-08-30T12:00:00.000Z",
    updatedAt: "2026-08-30T12:00:00.000Z",
    tags: [],
    ...overrides,
  };
}

test("ordinary single-newsroom Top Signal is not automatic lead eligible", () => {
  const single = story({
    id: "single",
    signal: "Top Signal",
    confidence: "Single-source",
  });

  assert.equal(isAutomaticLeadEligible(single), false);
  assert.equal(getTopSignalStory([single]), undefined);
});

test("multi-source Top Signal can become the automatic lead", () => {
  const multi = story({
    id: "multi",
    signal: "Top Signal",
    sources: ["Reuters", "Associated Press"],
    sourceUrls: ["https://reuters.com/a", "https://apnews.com/b"],
  });

  assert.equal(uniqueSourceCount(multi), 2);
  assert.equal(isAutomaticLeadEligible(multi), true);
  assert.equal(getTopSignalStory([multi])?.id, "multi");
});

test("primary-only update is recognized but does not become automatic lead", () => {
  const primary = story({
    id: "primary",
    signal: "Top Signal",
    sources: ["U.S. FDA"],
    sourceUrls: ["https://www.fda.gov/news-events/press-announcements/example"],
  });

  assert.equal(isPrimaryBackedStory(primary), true);
  assert.equal(isAutomaticLeadEligible(primary), false);
  assert.equal(getTopSignalStory([primary]), undefined);
});

test("live items are separated into multi-source, primary-only, and incoming lanes", () => {
  const multi = story({
    id: "multi",
    sources: ["Reuters", "BBC"],
    sourceUrls: ["https://reuters.com/a", "https://bbc.com/b"],
  });
  const primary = story({
    id: "primary",
    sources: ["NASA"],
    sourceUrls: ["https://www.nasa.gov/example"],
  });
  const incoming = story({ id: "incoming" });

  const buckets = partitionLiveStoriesByEvidence([incoming, primary, multi]);

  assert.deepEqual(buckets.multiSource.map((item) => item.id), ["multi"]);
  assert.deepEqual(buckets.primaryOnly.map((item) => item.id), ["primary"]);
  assert.deepEqual(buckets.incoming.map((item) => item.id), ["incoming"]);
});

test("multi-source lane ranks stronger corroboration above fresher weak coverage", () => {
  const stronger = story({
    id: "stronger",
    confidence: "Confirmed",
    sources: ["Reuters", "AP", "Official agency"],
    sourceUrls: [
      "https://reuters.com/a",
      "https://apnews.com/b",
      "https://agency.gov/release",
    ],
    updatedAt: "2026-08-30T10:00:00.000Z",
  });
  const fresher = story({
    id: "fresher",
    sources: ["Outlet A", "Outlet B"],
    sourceUrls: ["https://a.example/story", "https://b.example/story"],
    updatedAt: "2026-08-30T13:00:00.000Z",
  });

  const buckets = partitionLiveStoriesByEvidence([fresher, stronger]);
  assert.equal(buckets.multiSource[0]?.id, "stronger");
});
