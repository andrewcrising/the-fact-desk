import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDraftAssistMessages,
  generateEditorialDraftAssist,
  parseDraftAssistResponse,
  validateDraftAssistOutput,
  type DraftAssistContext,
} from "@/lib/ai/editorial-draft-assist";
import type { AiProvider } from "@/lib/ai/provider";

const context: DraftAssistContext = {
  story: {
    id: "story-1",
    title: "Draft story",
    slug: "draft-story",
    summary: "Current summary",
    what_happened: "Current what happened",
    why_it_matters: "Current why it matters",
    coverage_angle: "Current coverage angle",
    category: "World",
    signal: "Developing",
    confidence: "Single-source",
    evidence_level: "Low",
    uncertainty_note: "",
    tags: ["test"],
  },
  attached_sources: [
    {
      title: "Official report",
      source_name: "Agency",
      source_type: "government",
      url: "https://agency.gov/report",
      published_at: "2026-05-27T12:00:00Z",
      excerpt: "Short excerpt",
    },
  ],
  related_feed_items: [
    {
      title: "Feed item",
      source_name: "Agency",
      source_type: "government",
      url: "https://agency.gov/report",
      published_at: "2026-05-27T12:00:00Z",
      excerpt: "Feed summary",
    },
  ],
  evidence_assist: {
    source_count: 1,
    unique_source_count: 1,
    has_primary_source: true,
    has_official_source: true,
    has_multiple_independent_sources: false,
    source_spread: "primary-document",
    suggested_evidence_level: "Moderate",
    suggested_confidence: "Single-source",
    coverage_status_suggestion: "developing",
    undercovered_indicator: true,
    evidence_score: 55,
    explanation: "Moderate evidence based on one official source.",
    warnings: ["Single-source story."],
  },
};

describe("AI editorial draft assist", () => {
  it("builds a grounded prompt with sources and evidence assist", () => {
    const messages = buildDraftAssistMessages(context);
    assert.match(messages[0].content, /Do not invent facts/);
    assert.match(messages[0].content, /Output valid JSON only/);
    assert.match(messages[1].content, /agency.gov\/report/);
    assert.match(messages[1].content, /Moderate evidence based on one official source/);
  });

  it("validates complete JSON output", () => {
    const output = validateDraftAssistOutput({
      suggested_title: "Title",
      suggested_summary: "Summary",
      suggested_what_happened: "What happened",
      suggested_why_it_matters: "Why it matters",
      suggested_coverage_angle: "Coverage angle",
      suggested_uncertainty_note: "Uncertainty",
      confidence_rationale: "Rationale",
      source_spread_explanation: "Source spread",
      editorial_warnings: ["Warning"],
      claims_to_verify: ["Claim"],
      metadata_limitations: ["Metadata only"],
    });

    assert.equal(output.suggested_summary, "Summary");
    assert.deepEqual(output.claims_to_verify, ["Claim"]);
  });

  it("handles missing optional fields safely", () => {
    const output = validateDraftAssistOutput({
      suggested_summary: "Summary",
    });

    assert.equal(output.suggested_summary, "Summary");
    assert.equal(output.suggested_what_happened, "");
    assert.deepEqual(output.editorial_warnings, []);
  });

  it("rejects invalid JSON gracefully", () => {
    assert.throws(() => parseDraftAssistResponse("{not json"), /invalid JSON/);
  });

  it("uses mocked providers without external API calls", async () => {
    const provider: AiProvider = {
      async generateJson() {
        return JSON.stringify({
          suggested_summary: "Mock summary",
          suggested_what_happened: "Mock happened",
          suggested_why_it_matters: "Mock matters",
          suggested_coverage_angle: "Mock angle",
          suggested_uncertainty_note: "Mock uncertainty",
          confidence_rationale: "Mock confidence rationale",
          source_spread_explanation: "Mock source spread",
          editorial_warnings: [],
          claims_to_verify: [],
          metadata_limitations: ["Metadata-limited draft."],
        });
      },
    };

    const output = await generateEditorialDraftAssist(context, provider);
    assert.equal(output.suggested_summary, "Mock summary");
    assert.deepEqual(output.metadata_limitations, ["Metadata-limited draft."]);
  });
});
