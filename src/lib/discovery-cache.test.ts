import assert from "node:assert/strict";
import test from "node:test";
import { createDiscoveryCache, DISCOVERY_TTL_MS, MAX_FALLBACK_AGE_MS } from "./discovery-cache";
import { stories } from "@/data/stories";

test("discovery coalesces concurrent requests and does not relabel a failed refresh as live", async () => {
  let now = Date.parse("2026-11-13T12:00:00Z");
  const current = { ...stories[0], publishedAt: new Date(now - 1000).toISOString() };
  let calls = 0;
  let fail = false;
  const get = createDiscoveryCache(async () => { calls++; if (fail) throw Error("upstream"); return [current]; }, () => now);
  const results = await Promise.all([get(), get(), get()]);
  assert.equal(calls, 1);
  assert.equal(results[0].source, "live");
  const fetchedAt = results[0].fetchedAt;
  now += DISCOVERY_TTL_MS + 1;
  fail = true;
  const fallback = await get();
  assert.equal(fallback.source, "cache");
  assert.equal(fallback.fetchedAt, fetchedAt);
  assert.equal(fallback.stories.length, 1);
  await get();
  assert.equal(calls, 2, "outage retry backoff prevents per-reader fanout");
  now += MAX_FALLBACK_AGE_MS;
  assert.equal((await get()).stories.length, 0, "stale reports disappear after bounded fallback");
});

test("future, undated and old articles cannot seed the discovery cache", async () => {
  const now = Date.parse("2026-11-13T12:00:00Z");
  const get = createDiscoveryCache(async () => [
    { ...stories[0], publishedAt: "invalid" },
    { ...stories[0], publishedAt: new Date(now + 1).toISOString() },
    { ...stories[0], publishedAt: "2020-01-01T00:00:00Z" },
  ], () => now);
  assert.equal((await get()).stories.length, 0);
});

test("invalidation fences an older refresh and preserves the newer in-flight request", async () => {
  const now = Date.parse("2026-11-13T12:00:00Z");
  const story = { ...stories[0], publishedAt: new Date(now - 1000).toISOString() };
  const releases: Array<(stories: typeof story[]) => void> = [];
  const get = createDiscoveryCache(() => new Promise((resolve) => releases.push(resolve)), () => now);
  const first = get();
  get.invalidate();
  const second = get();
  releases[0]([{ ...story, id: "superseded" }]);
  assert.deepEqual((await first).stories, []);
  const concurrent = get();
  assert.equal(releases.length, 2, "old finally must not clear the current flight");
  releases[1]([{ ...story, id: "current" }]);
  assert.equal((await second).stories[0].id, "current");
  assert.equal((await concurrent).stories[0].id, "current");
  assert.equal((await get()).stories[0].id, "current");
});
