import assert from "node:assert/strict";
import test from "node:test";
import { normalizeFeedPublishedAt } from "@/lib/feed-repository";

test("normalizes valid feed timestamps for durable storage", () => {
  assert.equal(
    normalizeFeedPublishedAt("Wed, 27 May 2026 12:00:00 GMT"),
    "2026-05-27T12:00:00.000Z",
  );
});

test("malformed feed timestamps degrade to null instead of aborting a feed", () => {
  assert.equal(normalizeFeedPublishedAt("not-a-real-date"), null);
  assert.equal(normalizeFeedPublishedAt(undefined), null);
});
