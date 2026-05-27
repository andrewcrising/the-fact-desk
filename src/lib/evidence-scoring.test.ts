import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateEvidenceProfile } from "@/lib/evidence-scoring";

describe("evidence scoring", () => {
  it("scores a single RSS/news source as low evidence", () => {
    const profile = calculateEvidenceProfile({
      story: { category: "World", signal: "Developing", confidence: "Single-source" },
      sources: [
        {
          source_name: "Example News",
          url: "https://news.example.com/story",
          source_type: "rss",
        },
      ],
    });

    assert.equal(profile.source_count, 1);
    assert.equal(profile.unique_source_count, 1);
    assert.equal(profile.source_spread, "single-source");
    assert.equal(profile.suggested_evidence_level, "Low");
    assert.equal(profile.suggested_confidence, "Single-source");
  });

  it("scores one official source as moderate evidence", () => {
    const profile = calculateEvidenceProfile({
      story: { category: "Politics", signal: "Developing", confidence: "Developing" },
      sources: [
        {
          source_name: "Agency report",
          url: "https://agency.gov/reports/example",
          source_type: "government",
        },
      ],
    });

    assert.equal(profile.has_official_source, true);
    assert.equal(profile.source_spread, "primary-document");
    assert.equal(profile.suggested_evidence_level, "Moderate");
  });

  it("scores an official source plus secondary source as strong evidence", () => {
    const profile = calculateEvidenceProfile({
      story: { category: "Technology", signal: "Top Signal", confidence: "Developing" },
      sources: [
        {
          source_name: "CISA",
          url: "https://www.cisa.gov/advisories/example",
          source_type: "government",
        },
        {
          source_name: "Reuters",
          url: "https://www.reuters.com/example",
          source_type: "news",
        },
      ],
    });

    assert.equal(profile.has_primary_source, true);
    assert.equal(profile.has_multiple_independent_sources, true);
    assert.equal(profile.source_spread, "mixed");
    assert.equal(profile.suggested_evidence_level, "Strong");
  });

  it("scores three independent news sources as strong evidence", () => {
    const profile = calculateEvidenceProfile({
      story: { category: "Markets", signal: "Cross-angle", confidence: "Developing" },
      sources: [
        { source_name: "Reuters", url: "https://reuters.com/a", source_type: "news" },
        { source_name: "AP", url: "https://apnews.com/a", source_type: "news" },
        { source_name: "BBC", url: "https://bbc.com/news/a", source_type: "news" },
      ],
    });

    assert.equal(profile.unique_source_count, 3);
    assert.equal(profile.source_spread, "multi-source");
    assert.equal(profile.suggested_evidence_level, "Strong");
  });

  it("does not let duplicate sources inflate unique source count", () => {
    const profile = calculateEvidenceProfile({
      story: { category: "World", signal: "Developing", confidence: "Developing" },
      sources: [
        { source_name: "Reuters", url: "https://reuters.com/a", source_type: "news" },
        { source_name: "Reuters", url: "https://reuters.com/b", source_type: "news" },
      ],
    });

    assert.equal(profile.source_count, 2);
    assert.equal(profile.unique_source_count, 1);
    assert.equal(profile.suggested_evidence_level, "Low");
  });

  it("flags no sources and weak support for confirmed confidence", () => {
    const profile = calculateEvidenceProfile({
      story: { category: "Courts", signal: "Developing", confidence: "Confirmed" },
      sources: [],
    });

    assert.equal(profile.suggested_evidence_level, "Low");
    assert.ok(profile.warnings.includes("No source links are attached."));
    assert.ok(
      profile.warnings.includes(
        "Confirmed confidence appears stronger than attached source support.",
      ),
    );
  });

  it("mentions uncertainty in explanation when uncertainty note is present", () => {
    const profile = calculateEvidenceProfile({
      story: {
        category: "World",
        signal: "Developing",
        confidence: "Developing",
        uncertainty_note: "Official figures have not been reconciled.",
      },
      sources: [
        { source_name: "BBC", url: "https://bbc.com/news/a", source_type: "news" },
        { source_name: "UN", url: "https://un.org/report", source_type: "official" },
      ],
    });

    assert.match(profile.explanation, /Uncertainty note is present/);
  });

  it("marks public-interest low-pickup stories as under-covered candidates", () => {
    const profile = calculateEvidenceProfile({
      story: {
        category: "Health",
        signal: "Under-covered",
        confidence: "Developing",
        tags: ["public-health"],
      },
      sources: [
        { source_name: "Local Health Desk", url: "https://example.com/health", source_type: "news" },
      ],
    });

    assert.equal(profile.undercovered_indicator, true);
    assert.equal(profile.coverage_status_suggestion, "under-covered");
  });
});
