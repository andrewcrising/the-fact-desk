import assert from "node:assert/strict";
import test from "node:test";
import type { Story } from "@/types/story";
import { getTopSignalStory, isAutomaticLeadEligible, verifiedIndependentEvidenceCount } from "./stories";

function candidate(overrides: Partial<Story> = {}): Story {
  return {
    id: "candidate",
    slug: "candidate",
    title: "Example development",
    summary: "Summary",
    whatHappened: "What happened",
    whyItMatters: "Why it matters",
    category: "World",
    confidence: "Developing",
    signal: "Top Signal",
    sources: ["Outlet A", "Outlet B"],
    sourceUrls: ["https://a.example/report", "https://b.example/report"],
    sourceKinds: ["publisher", "publisher"],
    publishedAt: "2026-11-09T12:00:00Z",
    updatedAt: "2026-11-09T12:00:00Z",
    tags: [],
    ...overrides,
  };
}

test("distinct URLs and newsroom names are not verified independent reporting", () => {
  const item = candidate();
  assert.equal(verifiedIndependentEvidenceCount(item), 0);
  assert.equal(isAutomaticLeadEligible(item), false);
  assert.equal(getTopSignalStory([item]), undefined);
});

test("syndicated reports with the same verified origin do not corroborate", () => {
  const item = candidate({ verifiedIndependentOrigins: ["wire-story", "wire-story"] });
  assert.equal(verifiedIndependentEvidenceCount(item), 1);
  assert.equal(isAutomaticLeadEligible(item), false);
});

test("verified independent primary reporting remains eligible", () => {
  const item = candidate({ verifiedIndependentOrigins: ["outlet-a-original", "outlet-b-original"] });
  assert.equal(verifiedIndependentEvidenceCount(item), 2);
  assert.equal(isAutomaticLeadEligible(item), true);
});

test("disputed reporting cannot be an automatic lead", () => {
  const item = candidate({
    verifiedIndependentOrigins: ["outlet-a-original", "outlet-b-original"],
    confidence: "Disputed",
  });
  assert.equal(isAutomaticLeadEligible(item), false);
});

test("source kinds must be explicitly publisher or primary", () => {
  const item = candidate({
    verifiedIndependentOrigins: ["outlet-a-original", "outlet-b-original"],
    sourceKinds: ["publisher", "social"],
  });
  assert.equal(isAutomaticLeadEligible(item), false);
});

test("invalid evidence URLs never count", () => {
  const item = candidate({
    verifiedIndependentOrigins: ["outlet-a-original", "outlet-b-original"],
    sourceUrls: ["https://a.example/report", "javascript:malicious"],
  });
  assert.equal(isAutomaticLeadEligible(item), false);
});

test("incomplete aligned provenance cannot claim two independent sources", () => {
  const item = candidate({
    sources: ["Outlet A", "Outlet B", "Outlet C"],
    sourceUrls: ["https://a.example/a", "https://b.example/b", "https://c.example/c"],
    sourceKinds: ["publisher", "publisher", "publisher"],
    verifiedIndependentOrigins: ["outlet-a-original", null, "outlet-c-original"],
  });
  assert.equal(verifiedIndependentEvidenceCount(item), 2);
  assert.equal(isAutomaticLeadEligible(item), true);
});
