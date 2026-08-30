import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getHomepageStories,
  getStoryBySlug,
  isMockFallbackAllowed,
} from "@/lib/story-repository";

function setNodeEnv(value: string | undefined) {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, "NODE_ENV");
    return;
  }
  Object.assign(process.env, { NODE_ENV: value });
}

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

  it("allows mock fallback outside production", () => {
    const previousFallback = process.env.ALLOW_MOCK_FALLBACK;
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.ALLOW_MOCK_FALLBACK = "";
    setNodeEnv("test");

    assert.equal(isMockFallbackAllowed(), true);

    process.env.ALLOW_MOCK_FALLBACK = previousFallback;
    setNodeEnv(previousNodeEnv);
  });

  it("requires explicit mock fallback in production", () => {
    const previousFallback = process.env.ALLOW_MOCK_FALLBACK;
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.ALLOW_MOCK_FALLBACK = "";
    setNodeEnv("production");

    assert.equal(isMockFallbackAllowed(), false);

    process.env.ALLOW_MOCK_FALLBACK = "true";
    assert.equal(isMockFallbackAllowed(), true);

    process.env.ALLOW_MOCK_FALLBACK = previousFallback;
    setNodeEnv(previousNodeEnv);
  });
});
