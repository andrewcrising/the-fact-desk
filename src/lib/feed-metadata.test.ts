import assert from "node:assert/strict";
import test from "node:test";
import {
  readFactDeskFeedMetadata,
  withFactDeskFeedMetadata,
} from "./feed-metadata";

test("round-trips configured category and signal", () => {
  const payload = withFactDeskFeedMetadata(
    { sourceField: "kept" },
    {
      feedId: "cisa-advisories",
      category: "Technology",
      signal: "Developing",
    },
  );

  assert.equal(payload.sourceField, "kept");
  assert.deepEqual(readFactDeskFeedMetadata(payload), {
    feedId: "cisa-advisories",
    category: "Technology",
    signal: "Developing",
  });
});

test("ignores invalid untrusted metadata", () => {
  assert.deepEqual(
    readFactDeskFeedMetadata({
      factDesk: { category: "NotACategory", signal: "Viral" },
    }),
    { feedId: undefined, category: undefined, signal: undefined },
  );
});
