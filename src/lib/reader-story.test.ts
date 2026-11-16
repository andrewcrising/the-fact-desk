import assert from "node:assert/strict";
import { test } from "node:test";
import { stories } from "@/data/stories";
import { resolveReaderStoryBySlug } from "@/lib/reader-story";

test("reader routes prefer the durable published story", async () => {
  const published = { ...stories[0], slug: "shared-slug" };
  const discovery = { ...stories[1], slug: "shared-slug" };

  const result = await resolveReaderStoryBySlug("shared-slug", {
    getPublishedStory: async () => published,
    getDiscoveryStories: async () => ({ stories: [discovery] }),
  });

  assert.equal(result?.id, published.id);
});

test("reader routes resolve live discovery links without publishing them", async () => {
  const discovery = { ...stories[1], slug: "live-reader-route" };
  let discoveryCalls = 0;

  const result = await resolveReaderStoryBySlug("live-reader-route", {
    getPublishedStory: async () => undefined,
    getDiscoveryStories: async () => {
      discoveryCalls += 1;
      return { stories: [discovery] };
    },
  });

  assert.equal(result?.id, discovery.id);
  assert.equal(discoveryCalls, 1);
});

test("reader routes remain not found when neither source contains the slug", async () => {
  const result = await resolveReaderStoryBySlug("missing", {
    getPublishedStory: async () => undefined,
    getDiscoveryStories: async () => ({ stories: [] }),
  });

  assert.equal(result, undefined);
});
