import assert from "node:assert/strict";
import test from "node:test";
import { stories } from "@/data/stories";
import { deduplicateReaderStories } from "./reader-stories";

test("reader deduplication excludes lead articles across published and RSS sections", () => {
  const lead = { ...stories[0], sourceUrls: ["https://publisher.example/article?utm_source=rss#top"] };
  const duplicate = { ...lead, id: "rss", slug: "rss", sourceUrls: ["https://publisher.example/article"] };
  const other = { ...lead, id: "other", slug: "other", sourceUrls: ["https://publisher.example/another"] };
  assert.deepEqual(deduplicateReaderStories([duplicate, other], [lead]).map((s) => s.id), ["other"]);
});
