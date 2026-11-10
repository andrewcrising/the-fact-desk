import assert from "node:assert/strict";
import test from "node:test";
import type { Story } from "@/types/story";
import {
  getTopSignalStory,
  isAutomaticLeadEligible,
  isPrimaryBackedStory,
  partitionLiveStoriesByEvidence,
  uniqueSourceCount,
  storyPriorityScore,
} from "./stories";

function story(overrides: Partial<Story> & Pick<Story, "id">): Story {
  const { id, ...rest } = overrides;

  return {
    id,
    slug: id,
    title: id,
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
    ...rest,
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
    sourceKinds: ["publisher", "publisher"],
    verifiedIndependentOrigins: ["reuters-original", "ap-original"],
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
    sourceKinds: ["publisher", "publisher"],
    verifiedIndependentOrigins: ["reuters-original", "bbc-original"],
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
    sourceKinds: ["publisher", "publisher", "primary"],
    verifiedIndependentOrigins: ["reuters-original", "ap-original", "agency-original"],
    updatedAt: "2026-08-30T10:00:00.000Z",
  });
  const fresher = story({
    id: "fresher",
    sources: ["Outlet A", "Outlet B"],
    sourceUrls: ["https://a.example/story", "https://b.example/story"],
    sourceKinds: ["publisher", "publisher"],
    verifiedIndependentOrigins: ["outlet-a-original", "outlet-b-original"],
    updatedAt: "2026-08-30T13:00:00.000Z",
  });

  const buckets = partitionLiveStoriesByEvidence([fresher, stronger]);
  assert.equal(buckets.multiSource[0]?.id, "stronger");
});

test("unverified extra publishers cannot inflate live priority evidence bonus", () => {
  const baseline = story({ id: "baseline", sources: ["Outlet A"], sourceUrls: ["https://a.example/one"], sourceKinds: ["publisher"] });
  const syndicated = story({ ...baseline, id: "syndicated", sources: ["Outlet A", "Outlet B", "Outlet C"], sourceUrls: ["https://a.example/one", "https://b.example/two", "https://c.example/three"], sourceKinds: ["publisher", "publisher", "publisher"] });
  assert.equal(storyPriorityScore(syndicated), storyPriorityScore(baseline));
});

test("distinct verified origins increase priority evidence, duplicate origins do not", () => {
  const baseline = story({ id: "baseline", sources: ["Outlet A"], sourceUrls: ["https://a.example/one"], sourceKinds: ["publisher"], verifiedIndependentOrigins: ["original-a"] });
  const duplicated = story({ ...baseline, id: "duplicate", sources: ["Outlet A", "Outlet B"], sourceUrls: ["https://a.example/one", "https://b.example/two"], sourceKinds: ["publisher", "publisher"], verifiedIndependentOrigins: ["original-a", " original-a "] });
  const independent = story({ ...duplicated, id: "independent", verifiedIndependentOrigins: ["original-a", "original-b"] });
  assert.equal(storyPriorityScore(duplicated), storyPriorityScore(baseline));
  assert.equal(storyPriorityScore(independent) - storyPriorityScore(baseline), 7);
});


test("different unverified publisher domains cannot enter multi-source lane", () => {
  const unverified = story({ id: "unverified", sources: ["Outlet A", "Outlet B"], sourceUrls: ["https://a.example/a", "https://b.example/b"], sourceKinds: ["publisher", "publisher"] });
  const buckets = partitionLiveStoriesByEvidence([unverified]);
  assert.deepEqual(buckets.multiSource, []);
  assert.deepEqual(buckets.incoming.map((item) => item.id), ["unverified"]);
});

test("syndicated duplicate origin cannot enter multi-source lane", () => {
  const syndicated = story({ id: "syndicated", sources: ["Outlet A", "Outlet B"], sourceUrls: ["https://a.example/a", "https://b.example/b"], sourceKinds: ["publisher", "publisher"], verifiedIndependentOrigins: ["wire-a", " WIRE-A "] });
  assert.deepEqual(partitionLiveStoriesByEvidence([syndicated]).multiSource, []);
});

test("two verified origins qualify for multi-source lane", () => {
  const independent = story({ id: "independent", sources: ["Outlet A", "Outlet B"], sourceUrls: ["https://a.example/a", "https://b.example/b"], sourceKinds: ["publisher", "publisher"], verifiedIndependentOrigins: ["original-a", "original-b"] });
  assert.deepEqual(partitionLiveStoriesByEvidence([independent]).multiSource.map((item) => item.id), ["independent"]);
});
