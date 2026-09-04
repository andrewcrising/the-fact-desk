import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseStoryInput, parseStoryUpdateInput } from "@/lib/story-input";

describe("story input validation", () => {
  it("creates draft story input from required editor fields", () => {
    const input = parseStoryInput({
      title: "A draft story",
      summary: "Summary",
      whatHappened: "What happened",
      whyItMatters: "Why it matters",
      category: "World",
      signal: "Developing",
      confidence: "Single-source",
      evidenceLevel: "Low",
      uncertaintyNote: "Only one source has reported this so far.",
      tags: "seed, draft",
    });

    assert.equal(input.status, "draft");
    assert.equal(input.evidenceLevel, "Low");
    assert.equal(input.uncertaintyNote, "Only one source has reported this so far.");
    assert.deepEqual(input.tags, ["seed", "draft"]);
  });

  it("forces publishing through the publish action", () => {
    assert.throws(
      () => parseStoryUpdateInput({ status: "published" }),
      /publish action/,
    );
  });
});
