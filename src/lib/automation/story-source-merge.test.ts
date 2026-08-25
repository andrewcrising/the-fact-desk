import assert from "node:assert/strict";
import test from "node:test";
import { mergeStorySources } from "./story-source-merge";
import type { StorySource } from "@/types/editorial";

const existing: StorySource[] = [
  {
    id: "source-link-1",
    storyId: "story-1",
    sourceId: "source-1",
    feedItemId: "feed-1",
    url: "https://example.com/a",
    title: "Original report",
    sourceName: "Example News",
    publishedAt: "2026-08-25T10:00:00.000Z",
    createdAt: "2026-08-25T10:05:00.000Z",
  },
];

test("mergeStorySources preserves earlier evidence when a new source arrives", () => {
  const result = mergeStorySources(existing, [
    {
      sourceId: "source-2",
      sourceName: "Second Outlet",
      url: "https://second.example/report",
      title: "Follow-up report",
      feedItemId: "feed-2",
      publishedAt: "2026-08-25T11:00:00.000Z",
    },
  ]);

  assert.equal(result.length, 2);
  assert.equal(result[0]?.url, "https://example.com/a");
  assert.equal(result[1]?.url, "https://second.example/report");
});

test("mergeStorySources deduplicates the same URL and keeps fresh feed metadata", () => {
  const result = mergeStorySources(existing, [
    {
      sourceName: "Example News",
      url: "https://example.com/a/",
      title: "Updated report title",
      feedItemId: "feed-1-updated",
      publishedAt: "2026-08-25T10:30:00.000Z",
    },
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.title, "Updated report title");
  assert.equal(result[0]?.feedItemId, "feed-1-updated");
  assert.equal(result[0]?.sourceId, "source-1");
});
