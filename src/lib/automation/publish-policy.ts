import type { AiDraftAssistOutput } from "@/lib/ai/editorial-draft-assist";
import type { EvidenceProfile } from "@/lib/evidence-scoring";
import type { AutomationMode } from "@/types/editorial";
import type { Confidence, EvidenceLevel, StoryCategory, Signal } from "@/types/story";

export interface PublishPolicyStory {
  category: StoryCategory;
  signal: Signal;
  confidence: Confidence;
  evidenceLevel?: EvidenceLevel;
  summary?: string | null;
  whatHappened?: string | null;
  whyItMatters?: string | null;
  uncertaintyNote?: string | null;
}

export interface PublishPolicyInput {
  mode: AutomationMode;
  story: PublishPolicyStory;
  evidenceProfile: EvidenceProfile;
  aiOutput?: AiDraftAssistOutput | null;
  healthAutoPublishEnabled?: boolean;
}

export interface PublishDecision {
  canPublish: boolean;
  reasons: string[];
  warnings: string[];
}

function hasBody(story: PublishPolicyStory): boolean {
  return Boolean(
    story.summary?.trim() &&
      story.whatHappened?.trim() &&
      story.whyItMatters?.trim(),
  );
}

function confidencePasses(confidence: Confidence): boolean {
  return confidence === "Confirmed" || confidence === "Developing";
}

function evidencePasses(level?: EvidenceLevel): boolean {
  return level === "Moderate" || level === "Strong";
}

function hasSevereEvidenceWarning(warning: string): boolean {
  return (
    /No source links/.test(warning) ||
    /stronger than attached source support/.test(warning)
  );
}

export function evaluateGuardedPublish(input: PublishPolicyInput): PublishDecision {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const { story, evidenceProfile } = input;

  if (input.mode !== "guarded_auto_publish") {
    reasons.push("Automation mode is not guarded_auto_publish.");
  }
  if (story.category === "Health" && !input.healthAutoPublishEnabled) {
    reasons.push("Health auto-publish is disabled.");
  }
  if (evidenceProfile.source_count === 0) {
    reasons.push("No source links are attached.");
  }
  if (
    !(
      evidenceProfile.unique_source_count >= 2 ||
      evidenceProfile.has_official_source ||
      evidenceProfile.has_primary_source
    )
  ) {
    reasons.push("Source support does not meet guarded threshold.");
  }
  if (evidenceProfile.warnings.some(hasSevereEvidenceWarning)) {
    reasons.push("Evidence Assist has severe warnings.");
  }
  if (input.aiOutput?.claims_to_verify.length) {
    reasons.push("AI Draft Assist returned claims to verify.");
  }
  if (!evidencePasses(story.evidenceLevel)) {
    reasons.push("Evidence level is below Moderate.");
  }
  if (!confidencePasses(story.confidence)) {
    reasons.push("Confidence is not sufficient for guarded auto-publish.");
  }
  if (!hasBody(story)) {
    reasons.push("Story body fields are incomplete.");
  }
  if (
    (story.signal === "Developing" || story.confidence === "Disputed") &&
    !story.uncertaintyNote?.trim()
  ) {
    reasons.push("Developing or disputed story lacks an uncertainty note.");
  }

  if (story.evidenceLevel === "Moderate" && story.confidence === "Developing") {
    warnings.push("Guarded publish would proceed with moderate/developing posture.");
  }

  return {
    canPublish: reasons.length === 0,
    reasons,
    warnings,
  };
}
