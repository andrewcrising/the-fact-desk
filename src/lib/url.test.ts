import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDedupeKey, canonicalizeUrl } from "@/lib/url";

describe("url utilities", () => {
  it("canonicalizes tracking-heavy URLs", () => {
    assert.equal(
      canonicalizeUrl("https://Example.com/path/?utm_source=x&b=2#section"),
      "https://example.com/path/?b=2",
    );
  });

  it("builds stable feed-item dedupe keys", () => {
    assert.equal(
      buildDedupeKey({
        sourceId: "source-1",
        title: "  Story   Title ",
        canonicalUrl: "https://example.com/story",
        publishedAt: "2026-05-27T10:30:00.000Z",
      }),
      "source-1::https://example.com/story::2026-05-27",
    );
  });
});
