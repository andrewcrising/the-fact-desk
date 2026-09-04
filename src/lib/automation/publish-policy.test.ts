import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateGuardedPublish } from "@/lib/automation/publish-policy";
import type { EvidenceProfile } from "@/lib/evidence-scoring";

const baseEvidence: EvidenceProfile = {
  source_count: 2,
  unique_source_count: 2,
  has_primary_source: false,
  has_official_source: false,
  has_multiple_independent_sources: true,
  source_spread: "multi-source",
  suggested_evidence_level: "Moderate",
  suggested_confidence: "Developing",
  coverage_status_suggestion: "developing",
  undercovered_indicator: false,
  evidence_score: 55,
  explanation: "Moderate evidence.",
  warnings: [],
};

const baseStory = {
  category: "World" as const,
  signal: "Developing" as const,
  confidence: "Developing" as const,
  evidenceLevel: "Moderate" as const,
  summary: "Summary",
  whatHappened: "What happened",
  whyItMatters: "Why it matters",
  uncertaintyNote: "Still developing.",
};

describe("guarded publish policy", () => {
  it("blocks when automation mode is not guarded auto publish", () => {
    const decision = evaluateGuardedPublish({
      mode: "auto_draft",
      story: baseStory,
      evidenceProfile: baseEvidence,
    });

    assert.equal(decision.canPublish, false);
    assert.ok(decision.reasons.includes("Automation mode is not guarded_auto_publish."));
  });

  it("blocks stories without sources", () => {
    const decision = evaluateGuardedPublish({
      mode: "guarded_auto_publish",
      story: baseStory,
      evidenceProfile: { ...baseEvidence, source_count: 0, unique_source_count: 0 },
    });

    assert.equal(decision.canPublish, false);
    assert.ok(decision.reasons.includes("No source links are attached."));
  });

  it("allows an official source at moderate threshold", () => {
    const decision = evaluateGuardedPublish({
      mode: "guarded_auto_publish",
      story: baseStory,
      evidenceProfile: {
        ...baseEvidence,
        source_count: 1,
        unique_source_count: 1,
        has_official_source: true,
        has_primary_source: true,
        source_spread: "primary-document",
      },
    });

    assert.equal(decision.canPublish, true);
  });

  it("blocks claims to verify from AI output", () => {
    const decision = evaluateGuardedPublish({
      mode: "guarded_auto_publish",
      story: baseStory,
      evidenceProfile: baseEvidence,
      aiOutput: {
        suggested_title: "",
        suggested_summary: "",
        suggested_what_happened: "",
        suggested_why_it_matters: "",
        suggested_coverage_angle: "",
        suggested_uncertainty_note: "",
        confidence_rationale: "",
        source_spread_explanation: "",
        editorial_warnings: [],
        claims_to_verify: ["Verify claim"],
        metadata_limitations: [],
      },
    });

    assert.equal(decision.canPublish, false);
    assert.ok(decision.reasons.includes("AI Draft Assist returned claims to verify."));
  });

  it("blocks low evidence and missing uncertainty for developing stories", () => {
    const decision = evaluateGuardedPublish({
      mode: "guarded_auto_publish",
      story: { ...baseStory, evidenceLevel: "Low", uncertaintyNote: "" },
      evidenceProfile: baseEvidence,
    });

    assert.equal(decision.canPublish, false);
    assert.ok(decision.reasons.includes("Evidence level is below Moderate."));
    assert.ok(
      decision.reasons.includes("Developing or disputed story lacks an uncertainty note."),
    );
  });

  it("blocks health auto-publish by default", () => {
    const decision = evaluateGuardedPublish({
      mode: "guarded_auto_publish",
      story: { ...baseStory, category: "Health" },
      evidenceProfile: baseEvidence,
    });

    assert.equal(decision.canPublish, false);
    assert.ok(decision.reasons.includes("Health auto-publish is disabled."));
  });
});
