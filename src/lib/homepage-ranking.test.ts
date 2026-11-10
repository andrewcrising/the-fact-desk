import assert from "node:assert/strict";
import test from "node:test";
import { rankHomepageStories, type HomepageRankableStory } from "./homepage-ranking";

function story(
  overrides: Partial<HomepageRankableStory> & Pick<HomepageRankableStory, "id">,
): HomepageRankableStory {
  const { id, ...rest } = overrides;

  return {
    id,
    isLead: false,
    homepageRank: null,
    evidenceLevel: "Moderate",
    confidence: "Developing",
    signal: "Developing",
    storySources: [{}, {}],
    publishedAt: "2026-08-25T12:00:00.000Z",
    updatedAt: "2026-08-25T12:00:00.000Z",
    ...rest,
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

test("single-source Top Signal cannot outrank supported unpinned coverage", () => {
  const singleTopSignal = story({
    id: "single-top",
    evidenceLevel: "Low",
    confidence: "Single-source",
    signal: "Top Signal",
    storySources: [{}],
    updatedAt: new Date().toISOString(),
  });
  const supported = story({
    id: "supported",
    evidenceLevel: "Moderate",
    confidence: "Developing",
    signal: "Developing",
    storySources: [{}, {}],
    verifiedIndependentOrigins: ["independent-a", "independent-b"],
    updatedAt: "2026-08-20T12:00:00.000Z",
  });

  assert.equal(
    rankHomepageStories([singleTopSignal, supported])[0]?.id,
    "supported",
  );
});


test("unverified syndicated copies do not receive automatic corroboration", () => {
  const syndicated = story({ id: "syndicated", storySources: [{}, {}, {}], verifiedIndependentOrigins: [null, null, null], confidence: "Developing" });
  const verified = story({ id: "verified", storySources: [{}, {}], verifiedIndependentOrigins: ["origin-a", "origin-b"], confidence: "Developing" });
  assert.equal(rankHomepageStories([syndicated, verified])[0]?.id, "verified");
});

test("duplicate and malformed origins fail closed", () => {
  const duplicate = story({ id: "duplicate", storySources: [{}, {}, {}], verifiedIndependentOrigins: ["wire", "wire", "wire"] });
  const malformed = story({ id: "malformed", storySources: [{}, {}], verifiedIndependentOrigins: ["origin-a"] });
  const verified = story({ id: "verified", storySources: [{}, {}], verifiedIndependentOrigins: ["origin-a", "origin-b"] });
  assert.equal(rankHomepageStories([duplicate, malformed, verified])[0]?.id, "verified");
});

test("explicit editorial lead remains authoritative without provenance", () => {
  const lead = story({ id: "lead", isLead: true, storySources: [{}] });
  const verified = story({ id: "verified", storySources: [{}, {}], verifiedIndependentOrigins: ["a", "b"] });
  assert.equal(rankHomepageStories([verified, lead])[0]?.id, "lead");
});


test("whitespace variants of the same origin cannot manufacture corroboration", () => {
  const duplicated = story({
    id: "duplicated",
    storySources: [{}, {}],
    verifiedIndependentOrigins: ["wire-story-1", " wire-story-1 "],
    confidence: "Developing",
  });
  const distinct = story({
    id: "distinct",
    storySources: [{}, {}],
    verifiedIndependentOrigins: ["wire-story-1", "original-report-2"],
    confidence: "Developing",
  });
  assert.equal(rankHomepageStories([duplicated, distinct])[0]?.id, "distinct");
});
