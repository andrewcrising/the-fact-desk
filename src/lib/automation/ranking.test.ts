import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rankStories, scoreRankableStory } from "@/lib/automation/ranking";

describe("automation ranking", () => {
  it("ranks stronger evidence higher", () => {
    const weak = {
      id: "weak",
      evidenceLevel: "Low" as const,
      confidence: "Single-source" as const,
      signal: "Developing" as const,
      sourceCount: 1,
    };
    const strong = {
      id: "strong",
      evidenceLevel: "Strong" as const,
      confidence: "Confirmed" as const,
      signal: "Developing" as const,
      sourceCount: 3,
    };

    assert.ok(scoreRankableStory(strong) > scoreRankableStory(weak));
  });

  it("boosts under-covered signals", () => {
    const normal = {
      id: "normal",
      evidenceLevel: "Moderate" as const,
      confidence: "Developing" as const,
      signal: "Developing" as const,
      sourceCount: 2,
    };
    const underCovered = {
      ...normal,
      id: "under",
      signal: "Under-covered" as const,
      undercoveredIndicator: true,
    };

    assert.equal(rankStories([normal, underCovered])[0].id, "under");
  });

  it("keeps preference hooks from changing facts", () => {
    const story = {
      id: "story",
      evidenceLevel: "Moderate" as const,
      confidence: "Developing" as const,
      signal: "Developing" as const,
      sourceCount: 2,
    };
    const ranked = rankStories([story], { officialSourceHeavy: true });

    assert.deepEqual(ranked[0], story);
  });
});
