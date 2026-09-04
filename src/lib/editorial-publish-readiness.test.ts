import assert from "node:assert/strict";
import test from "node:test";
import { evaluatePublishReadiness } from "@/lib/editorial-publish-readiness";
import type { PersistedStory } from "@/types/editorial";

function story(overrides: Partial<PersistedStory> = {}): PersistedStory {
  const now = "2026-09-03T12:00:00.000Z";
  return {
    id: "story-1",
    slug: "story-1",
    title: "Reviewed headline",
    summary: "A useful reviewed summary.",
    whatHappened: "The reviewed factual account.",
    whyItMatters: "The reviewed significance.",
    category: "World",
    confidence: "Developing",
    evidenceLevel: "Moderate",
    signal: "Developing",
    sources: ["Example News"],
    sourceUrls: ["https://example.com/report"],
    publishedAt: now,
    updatedAt: now,
    tags: [],
    uncertaintyNote: "Some details remain under verification.",
    status: "draft",
    homepageRank: null,
    isLead: false,
    storySources: [
      {
        id: "source-link-1",
        storyId: "story-1",
        sourceId: "source-1",
        feedItemId: "feed-1",
        url: "https://example.com/report",
        title: "Original report",
        sourceName: "Example News",
        publishedAt: now,
        createdAt: now,
      },
    ],
    createdAt: now,
    ...overrides,
  };
}

test("reviewed draft with source evidence is publish-ready", () => {
  const result = evaluatePublishReadiness(story());
  assert.equal(result.ready, true);
  assert.deepEqual(result.reasons, []);
});

test("source-less draft cannot be published", () => {
  const result = evaluatePublishReadiness(
    story({ storySources: [], sources: [], sourceUrls: [] }),
  );
  assert.equal(result.ready, false);
  assert.ok(result.reasons.includes("no attached sources"));
});

test("thin evidence requires explicit uncertainty language", () => {
  const result = evaluatePublishReadiness(
    story({ confidence: "Single-source", evidenceLevel: "Low", uncertaintyNote: undefined }),
  );
  assert.equal(result.ready, false);
  assert.ok(
    result.reasons.includes("thin or disputed evidence requires an uncertainty note"),
  );
});

test("malformed source URL blocks publication", () => {
  const base = story();
  const result = evaluatePublishReadiness({
    ...base,
    storySources: [{ ...base.storySources[0], url: "not-a-url" }],
  });
  assert.equal(result.ready, false);
  assert.ok(result.reasons.includes("invalid source URL"));
});
