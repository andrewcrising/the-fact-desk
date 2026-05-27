import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getHomepageStories, getStoryBySlug } from "@/lib/story-repository";

describe("story repository fallback", () => {
  it("returns published mock stories when Supabase is not configured", async () => {
    const stories = await getHomepageStories();
    assert.ok(stories.length > 0);
    assert.equal(stories.every((story) => story.status === "published"), true);
  });

  it("resolves detail slugs shown by fallback homepage stories", async () => {
    const [first] = await getHomepageStories();
    assert.ok(first);

    const story = await getStoryBySlug(first.slug);
    assert.equal(story?.slug, first.slug);
  });
});
