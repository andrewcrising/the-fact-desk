import assert from "node:assert/strict";
import test from "node:test";
import { parseStoryInput, parseStoryUpdateInput } from "@/lib/story-input";

const valid = {
  title: "Test", summary: "Summary", whatHappened: "Facts", whyItMatters: "Impact",
  category: "World", signal: "Developing", confidence: "Single-source",
  verifiedIndependentOrigins: ["spoofed"],
  sourceAttachments: [{
    sourceName: "Publisher", url: "https://publisher.example/report",
    verifiedIndependentOrigins: ["spoofed"], originId: "spoofed",
    reviewedBy: "attacker", reviewedAt: "2026-11-09T00:00:00Z",
  }],
};

test("public create payload cannot set reviewer provenance", () => {
  const parsed = parseStoryInput(valid);
  assert.equal("verifiedIndependentOrigins" in parsed, false);
  assert.deepEqual(parsed.sourceAttachments?.[0], {
    sourceId: undefined, sourceName: "Publisher", url: "https://publisher.example/report",
    title: undefined, feedItemId: undefined, publishedAt: undefined,
  });
});
test("public update payload cannot set reviewer provenance", () => {
  const parsed = parseStoryUpdateInput(valid);
  assert.equal("verifiedIndependentOrigins" in parsed, false);
  assert.equal("originId" in (parsed.sourceAttachments?.[0] ?? {}), false);
});
