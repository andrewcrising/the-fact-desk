import assert from "node:assert/strict";
import test from "node:test";
import { clusterAndBalanceStories } from "@/lib/ingest/cluster-stories";
import type { Story } from "@/types/story";

const now = new Date().toISOString();
function item(id: string, source: string, url: string, overrides: Partial<Story> = {}): Story {
  return { id, slug: id, title: "Regional Agency Announces Significant Transit Service Interruption",
    summary: `An agency announced a major regional interruption affecting passengers and commuter services. Original detail ${id}.`,
    whatHappened: "Transit interrupted", whyItMatters: "Commuters affected",
    category: "World", confidence: "Single-source", signal: "Developing",
    sources: [source], sourceUrls: [url], sourceKinds: ["publisher"],
    publishedAt: now, updatedAt: now, tags: [], ...overrides };
}
test("same publisher different articles preserve citation alignment", () => {
  const result = clusterAndBalanceStories([
    item("a", "Publisher", "https://publisher.example/a"),
    item("b", "Publisher", "https://publisher.example/b")
  ])[0];
  assert.deepEqual(result.sourceUrls, ["https://publisher.example/a", "https://publisher.example/b"]);
  assert.deepEqual(result.sources, ["Publisher", "Publisher"]);
  assert.equal(result.signal, "Developing");
});
test("missing URL and credential-bearing URL do not earn publisher credit", () => {
  const result = clusterAndBalanceStories([
    item("a", "Publisher A", ""),
    item("b", "Publisher B", "https://user:pass@publisher.example/b")
  ])[0];
  assert.deepEqual(result.sourceKinds, ["open-web", "open-web"]);
  assert.deepEqual(result.verifiedIndependentOrigins, [null, null]);
});
test("same URL from different outlets cannot double-count", () => {
  const result = clusterAndBalanceStories([
    item("a", "Publisher A", "https://wire.example/story", { verifiedIndependentOrigins: ["a"] }),
    item("b", "Publisher B", "https://wire.example/story", { verifiedIndependentOrigins: ["b"] })
  ])[0];
  assert.equal(result.sources.length, 1);
  assert.deepEqual(result.verifiedIndependentOrigins, [null]);
});
test("disputed reports never become Cross-angle on aggregation", () => {
  const result = clusterAndBalanceStories([
    item("a", "Publisher A", "https://a.example/report", { confidence: "Disputed" }),
    item("b", "Publisher B", "https://b.example/report")
  ])[0];
  assert.equal(result.confidence, "Disputed");
  assert.notEqual(result.signal, "Cross-angle");
});
test("independent verified origins remain aligned across distinct valid articles", () => {
  const result = clusterAndBalanceStories([
    item("a", "Publisher A", "https://a.example/report", { verifiedIndependentOrigins: ["a-original"] }),
    item("b", "Publisher B", "https://b.example/report", { verifiedIndependentOrigins: ["b-original"] })
  ])[0];
  assert.deepEqual(result.verifiedIndependentOrigins, ["a-original", "b-original"]);
});

test("identical substantive syndicated text is not independent corroboration", () => {
  const summary = "A wire report describing the same transit interruption was republished without independent reporting or additional facts.";
  const result = clusterAndBalanceStories([
    item("a", "Publisher A", "https://a.example/report", { summary }),
    item("b", "Publisher B", "https://b.example/report", { summary })
  ])[0];
  assert.deepEqual(result.sourceKinds, ["publisher", "open-web"]);
  assert.notEqual(result.signal, "Cross-angle");
});

test("inherited Cross-angle is revoked when citations are unverified", () => {
  const result = clusterAndBalanceStories([
    item("a", "Publisher A", "", { signal: "Cross-angle" }),
    item("b", "Publisher B", "https://user:pass@publisher.example/b")
  ])[0];
  assert.equal(result.signal, "Developing");
  assert.equal(result.confidence, "Single-source");
});

test("disputed Cross-angle input cannot survive a failed corroboration gate", () => {
  const result = clusterAndBalanceStories([
    item("a", "Publisher A", "https://a.example/report", { signal: "Cross-angle", confidence: "Disputed" }),
    item("b", "Publisher B", "https://b.example/report")
  ])[0];
  assert.equal(result.signal, "Developing");
  assert.equal(result.confidence, "Disputed");
});

test("different publisher domains without attested origins cannot create Cross-angle", () => {
  const result = clusterAndBalanceStories([
    item("unverified-a", "Publisher A", "https://a.example/report"),
    item("unverified-b", "Publisher B", "https://b.example/report"),
  ])[0];
  assert.equal(result.signal, "Developing");
  assert.equal(result.confidence, "Single-source");
});

test("distinct attested reporting origins support Cross-angle", () => {
  const result = clusterAndBalanceStories([
    item("attested-a", "Publisher A", "https://a.example/report", { verifiedIndependentOrigins: ["origin-a"] }),
    item("attested-b", "Publisher B", "https://b.example/report", { verifiedIndependentOrigins: ["origin-b"] }),
  ])[0];
  assert.equal(result.signal, "Cross-angle");
});

test("different domains sharing one wire origin do not establish independence", () => {
  const result = clusterAndBalanceStories([
    item("wire-a", "Publisher A", "https://a.example/report", { verifiedIndependentOrigins: ["wire-1"] }),
    item("wire-b", "Publisher B", "https://b.example/report", { verifiedIndependentOrigins: [" wire-1 "] }),
  ])[0];
  assert.equal(result.signal, "Developing");
});
