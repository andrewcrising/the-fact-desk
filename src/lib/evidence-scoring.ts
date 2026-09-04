import type {
  Confidence,
  EvidenceLevel,
  Signal,
  StoryCategory,
} from "@/types/story";
import type { SourceType } from "@/types/editorial";

export type SourceSpread =
  | "single-source"
  | "multi-source"
  | "official-source"
  | "primary-document"
  | "mixed";

export type CoverageStatusSuggestion =
  | "under-covered"
  | "developing"
  | "widely-covered"
  | "disputed"
  | "follow-up-needed";

export interface EvidenceAssistSource {
  source_id?: string | null;
  source_name: string;
  url: string;
  source_type?: SourceType | string | null;
  feed_item_status?: string | null;
}

export interface EvidenceScoringStoryInput {
  category?: StoryCategory;
  signal?: Signal;
  confidence?: Confidence;
  evidence_level?: EvidenceLevel;
  tags?: string[];
  uncertainty_note?: string | null;
}

export interface EvidenceProfile {
  source_count: number;
  unique_source_count: number;
  has_primary_source: boolean;
  has_official_source: boolean;
  has_multiple_independent_sources: boolean;
  source_spread: SourceSpread;
  suggested_evidence_level: EvidenceLevel;
  suggested_confidence: Confidence;
  coverage_status_suggestion: CoverageStatusSuggestion;
  undercovered_indicator: boolean;
  evidence_score: number;
  explanation: string;
  warnings: string[];
  uncertainty_note_suggestion?: string;
}

const OFFICIAL_SOURCE_TYPES = new Set([
  "official",
  "government",
  "academic",
  "primary-document",
  "regulator",
  "court",
  "company",
]);

const PRIMARY_SOURCE_TYPES = new Set([
  "official",
  "government",
  "academic",
  "primary-document",
  "regulator",
  "court",
  "company",
]);

const PRIMARY_NAME_OR_URL_PATTERNS = [
  /\b(court|docket|filing|regulator|agency|department|ministry|official|press release)\b/i,
  /\b(report|audit|study|journal|university|nih|who|cisa|sec|federal reserve)\b/i,
  /\.(gov|mil|edu)(\/|$)/i,
  /\/(press|releases?|reports?|filings?|docket|advisories?|guidance)\b/i,
];

const PUBLIC_INTEREST_CATEGORIES = new Set<StoryCategory>([
  "Politics",
  "Markets",
  "Technology",
  "World",
  "Health",
  "Courts",
  "Energy",
]);

const PUBLIC_INTEREST_TAGS = [
  "policy",
  "court",
  "regulation",
  "health",
  "safety",
  "cyber",
  "infrastructure",
  "energy",
  "public",
  "audit",
];

function sourceKey(source: EvidenceAssistSource): string {
  if (source.source_id) return source.source_id;
  const domain = sourceDomain(source.url);
  return (domain || source.source_name).toLowerCase().trim();
}

function sourceDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function sourceText(source: EvidenceAssistSource): string {
  return `${source.source_name} ${source.url} ${source.source_type ?? ""}`;
}

function isPrimarySource(source: EvidenceAssistSource): boolean {
  if (source.source_type && PRIMARY_SOURCE_TYPES.has(source.source_type)) {
    return true;
  }
  return PRIMARY_NAME_OR_URL_PATTERNS.some((pattern) =>
    pattern.test(sourceText(source)),
  );
}

function isOfficialSource(source: EvidenceAssistSource): boolean {
  if (source.source_type && OFFICIAL_SOURCE_TYPES.has(source.source_type)) {
    return true;
  }
  return PRIMARY_NAME_OR_URL_PATTERNS.some((pattern) =>
    pattern.test(sourceText(source)),
  );
}

function inferSourceSpread(input: {
  sourceCount: number;
  uniqueSourceCount: number;
  hasPrimarySource: boolean;
  hasOfficialSource: boolean;
}): SourceSpread {
  if (input.hasPrimarySource && input.uniqueSourceCount > 1) return "mixed";
  if (input.hasPrimarySource) return "primary-document";
  if (input.hasOfficialSource) return "official-source";
  if (input.uniqueSourceCount > 1) return "multi-source";
  return "single-source";
}

function hasPublicInterestSignal(story: EvidenceScoringStoryInput): boolean {
  if (story.signal === "Under-covered" || story.signal === "Top Signal") {
    return true;
  }
  if (story.category && PUBLIC_INTEREST_CATEGORIES.has(story.category)) {
    return true;
  }
  return Boolean(
    story.tags?.some((tag) =>
      PUBLIC_INTEREST_TAGS.some((keyword) =>
        tag.toLowerCase().includes(keyword),
      ),
    ),
  );
}

function scoreEvidence(input: {
  sourceCount: number;
  uniqueSourceCount: number;
  hasPrimarySource: boolean;
  hasOfficialSource: boolean;
  hasMultipleIndependentSources: boolean;
  uncertaintyNote?: string | null;
}): number {
  if (input.sourceCount === 0) return 0;

  let score = Math.min(input.uniqueSourceCount * 15, 45);
  if (input.hasOfficialSource) score += 20;
  if (input.hasPrimarySource) score += 20;
  if (input.hasMultipleIndependentSources) score += 15;
  if (input.uncertaintyNote) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function suggestEvidenceLevel(input: {
  evidenceScore: number;
  sourceCount: number;
  uniqueSourceCount: number;
  hasPrimarySource: boolean;
  hasOfficialSource: boolean;
  hasMultipleIndependentSources: boolean;
}): EvidenceLevel {
  if (
    (input.hasPrimarySource && input.hasMultipleIndependentSources) ||
    input.uniqueSourceCount >= 3 ||
    input.evidenceScore >= 70
  ) {
    return "Strong";
  }
  if (
    input.hasOfficialSource ||
    input.hasPrimarySource ||
    input.uniqueSourceCount >= 2 ||
    input.evidenceScore >= 40
  ) {
    return "Moderate";
  }
  return "Low";
}

function suggestConfidence(input: {
  evidenceLevel: EvidenceLevel;
  hasUncertainty: boolean;
  sourceCount: number;
  currentConfidence?: Confidence;
}): Confidence {
  if (input.currentConfidence === "Disputed") return "Disputed";
  if (input.sourceCount === 0 || input.sourceCount === 1) return "Single-source";
  if (input.evidenceLevel === "Strong" && !input.hasUncertainty) return "Confirmed";
  return "Developing";
}

function suggestCoverageStatus(input: {
  story: EvidenceScoringStoryInput;
  sourceCount: number;
  uniqueSourceCount: number;
  undercoveredIndicator: boolean;
  hasUncertainty: boolean;
}): CoverageStatusSuggestion {
  if (input.story.confidence === "Disputed") return "disputed";
  if (input.sourceCount === 0) return "follow-up-needed";
  if (input.undercoveredIndicator) return "under-covered";
  if (input.uniqueSourceCount >= 4) return "widely-covered";
  if (input.hasUncertainty || input.story.signal === "Developing") return "developing";
  return "follow-up-needed";
}

function buildExplanation(input: {
  evidenceLevel: EvidenceLevel;
  sourceSpread: SourceSpread;
  sourceCount: number;
  uniqueSourceCount: number;
  hasOfficialSource: boolean;
  hasPrimarySource: boolean;
  hasUncertainty: boolean;
}): string {
  const parts = [
    `${input.evidenceLevel} evidence: ${input.sourceCount} attached source link${
      input.sourceCount === 1 ? "" : "s"
    } from ${input.uniqueSourceCount} distinct source${
      input.uniqueSourceCount === 1 ? "" : "s"
    }.`,
  ];

  if (input.hasPrimarySource) parts.push("Primary-source signal detected.");
  else if (input.hasOfficialSource) parts.push("Official-source signal detected.");
  else parts.push(`Source spread is ${input.sourceSpread}.`);

  if (input.hasUncertainty) {
    parts.push("Uncertainty note is present, so editorial review should keep limits visible.");
  }

  return parts.join(" ");
}

export function calculateEvidenceProfile(input: {
  story: EvidenceScoringStoryInput;
  sources: EvidenceAssistSource[];
}): EvidenceProfile {
  const sourceCount = input.sources.length;
  const uniqueKeys = new Set(input.sources.map(sourceKey));
  const uniqueSourceCount = uniqueKeys.size;
  const hasPrimarySource = input.sources.some(isPrimarySource);
  const hasOfficialSource = input.sources.some(isOfficialSource);
  const hasMultipleIndependentSources = uniqueSourceCount >= 2;
  const hasUncertainty = Boolean(input.story.uncertainty_note?.trim());
  const sourceSpread = inferSourceSpread({
    sourceCount,
    uniqueSourceCount,
    hasPrimarySource,
    hasOfficialSource,
  });
  const evidenceScore = scoreEvidence({
    sourceCount,
    uniqueSourceCount,
    hasPrimarySource,
    hasOfficialSource,
    hasMultipleIndependentSources,
    uncertaintyNote: input.story.uncertainty_note,
  });
  const suggestedEvidenceLevel = suggestEvidenceLevel({
    evidenceScore,
    sourceCount,
    uniqueSourceCount,
    hasPrimarySource,
    hasOfficialSource,
    hasMultipleIndependentSources,
  });
  const suggestedConfidence = suggestConfidence({
    evidenceLevel: suggestedEvidenceLevel,
    hasUncertainty,
    sourceCount,
    currentConfidence: input.story.confidence,
  });
  const undercoveredIndicator =
    uniqueSourceCount < 3 && hasPublicInterestSignal(input.story);
  const coverageStatusSuggestion = suggestCoverageStatus({
    story: input.story,
    sourceCount,
    uniqueSourceCount,
    undercoveredIndicator,
    hasUncertainty,
  });

  const warnings: string[] = [];
  if (sourceCount === 0) {
    warnings.push("No source links are attached.");
  }
  if (
    input.story.confidence === "Confirmed" &&
    (suggestedEvidenceLevel === "Low" || uniqueSourceCount < 2)
  ) {
    warnings.push("Confirmed confidence appears stronger than attached source support.");
  }
  if (
    (input.story.signal === "Developing" || input.story.confidence === "Disputed") &&
    !hasUncertainty
  ) {
    warnings.push("Developing or disputed stories should usually include an uncertainty note.");
  }
  if (input.story.evidence_level === "Low" || suggestedEvidenceLevel === "Low") {
    warnings.push("Low evidence posture: keep placement and wording cautious.");
  }

  const uncertaintyNoteSuggestion =
    !hasUncertainty && (sourceCount <= 1 || input.story.signal === "Developing")
      ? "What remains unknown: source support is limited or the story is still developing; verify before stronger placement."
      : undefined;

  return {
    source_count: sourceCount,
    unique_source_count: uniqueSourceCount,
    has_primary_source: hasPrimarySource,
    has_official_source: hasOfficialSource,
    has_multiple_independent_sources: hasMultipleIndependentSources,
    source_spread: sourceSpread,
    suggested_evidence_level: suggestedEvidenceLevel,
    suggested_confidence: suggestedConfidence,
    coverage_status_suggestion: coverageStatusSuggestion,
    undercovered_indicator: undercoveredIndicator,
    evidence_score: evidenceScore,
    explanation: buildExplanation({
      evidenceLevel: suggestedEvidenceLevel,
      sourceSpread,
      sourceCount,
      uniqueSourceCount,
      hasOfficialSource,
      hasPrimarySource,
      hasUncertainty,
    }),
    warnings,
    uncertainty_note_suggestion: uncertaintyNoteSuggestion,
  };
}
