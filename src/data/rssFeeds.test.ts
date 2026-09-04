import assert from "node:assert/strict";
import test from "node:test";
import {
  RSS_FEEDS,
  validateRssFeedCatalog,
  type RssFeedConfig,
} from "@/data/rssFeeds";

test("pilot RSS catalog has unique secure source configuration", () => {
  assert.deepEqual(validateRssFeedCatalog(), []);
  assert.equal(RSS_FEEDS.filter((feed) => feed.enabled).length, 13);
});

test("catalog validation rejects duplicate ids and feed URLs", () => {
  const base = RSS_FEEDS[0];
  const duplicate: RssFeedConfig = {
    ...base,
    sourceName: "Duplicate source",
  };
  const errors = validateRssFeedCatalog([base, duplicate]);
  assert.ok(errors.some((error) => error.startsWith("duplicate feed id:")));
  assert.ok(errors.some((error) => error.startsWith("duplicate feed URL:")));
});

test("catalog validation rejects non-HTTPS endpoints", () => {
  const insecure: RssFeedConfig = {
    ...RSS_FEEDS[0],
    id: "insecure-test",
    feedUrl: "http://example.com/feed.xml",
  };
  const errors = validateRssFeedCatalog([insecure]);
  assert.ok(errors.includes("insecure-test: feed URL must use HTTPS"));
});
