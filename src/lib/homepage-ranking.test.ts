import assert from "node:assert/strict";
import test from "node:test";
import { rankHomepageStories, type HomepageRankableStory } from "./homepage-ranking";

function story(
  overrides: Partial<HomepageRankableStory> & Pick<HomepageRankableStory, "id">,
): HomepageRankableStory {
  return {
    id: overrides.id,
    isLead: false,
    homepageRank: null,
    evidenceLevel: "Moderate",
    confidence: "Developing",
    signal: "Developing",
    storySources: [{}, {}],
    publishedAt: "2026-08-25T12:00:00.000Z",
    updatedAt: "2026-08-25T12:00:00.000Z",
    ...overrides,
  };
}

test("explicit lead override remains first", () => {
  const strong = story({
    id: "strong",
    evidenceLevel: "Strong",
    confidence: "Confirmed",
    storySources: [{}, {}, {}],
  });
  const lead = story({
    id: "lead",
    isLead: true,
    evidenceLevel: "Low",
    confidence: "Single-source",
    storySources: [{}],
  });

  assert.equal(rankHomepageStories([strong, lead])[0]?.id, "lead");
});

test("explicit homepage rank beats unpinned automated score", () => {
  const strong = story({
    id: "strong",
    evidenceLevel: "Strong",
    confidence: "Confirmed",
    storySources: [{}, {}, {}],
  });
  const pinned = story({
    id: "pinned",
    homepageRank: 2,
    evidenceLevel: "Low",
    confidence: "Single-source",
    storySources: [{}],
  });
  const firstPinned = story({
    id: "first-pinned",
    homepageRank: 1,
  });

  assert.deepEqual(
    rankHomepageStories([strong, pinned, firstPinned]).map((item) => item.id),
    ["first-pinned", "pinned", "strong"],
  );
});

test("unpinned stories use evidence-first automated ordering", () => {
  const weak = story({
    id: "weak",
    evidenceLevel: "Low",
    confidence: "Single-source",
    storySources: [{}],
  });
  const strong = story({
    id: "strong",
    evidenceLevel: "Strong",
    confidence: "Confirmed",
    storySources: [{}, {}, {}],
  });

  assert.equal(rankHomepageStories([weak, strong])[0]?.id, "strong");
});
