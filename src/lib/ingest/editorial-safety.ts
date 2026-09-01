import type { Story } from "@/types/story";

const REPUTATIONAL_CLAIM_PATTERN =
  /\b(alleg(?:e|es|ed|edly|ation|ations)|accus(?:e|es|ed|ation|ations)|charged?|indict(?:ed|ment)|investigat(?:e|es|ed|ing|ion)|lawsuit|complaint|fraud|bribery|corrupt(?:ion|ed)?|misconduct|harass(?:ment|ed)?|assault(?:ed)?|abuse(?:d)?|embezzl(?:e|ed|ement)|theft|stole|scam(?:med)?|criminal|murder(?:ed)?|kill(?:ed|ing)|lied|false statement(?:s)?)\b/i;

const EXPLICIT_ATTRIBUTION_PATTERN =
  /\b(according to|police say|police said|prosecutors? say|prosecutors? said|court filing|lawsuit (?:says|said|alleges)|complaint (?:says|said|alleges)|was charged|were charged|was indicted|were indicted|was convicted|were convicted|alleged|allegedly|accused|claims?|reported by|reports?)\b/i;

export interface ReputationalRiskAssessment {
  sensitive: boolean;
  alreadyAttributed: boolean;
}

export function assessReputationalRisk(
  title: string,
  summary: string,
): ReputationalRiskAssessment {
  const combined = `${title} ${summary}`;
  return {
    sensitive: REPUTATIONAL_CLAIM_PATTERN.test(combined),
    alreadyAttributed: EXPLICIT_ATTRIBUTION_PATTERN.test(combined),
  };
}

function sourceLabel(story: Story): string {
  if (story.sources.length === 0) return "The linked source";
  if (story.sources.length === 1) return story.sources[0] ?? "The linked source";
  if (story.sources.length === 2) return `${story.sources[0]} and ${story.sources[1]}`;
  return `${story.sources.slice(0, 2).join(", ")} and ${story.sources.length - 2} more sources`;
}

/**
 * Reputation-sensitive claims must remain visibly attributed at the final public
 * serialization boundary. This is a conservative editorial safeguard, not a
 * determination that a claim is true, false, defamatory, or legally actionable.
 */
export function attributionSafeBriefing(
  story: Story,
  summary: string,
): {
  title: string;
  summary: string;
  whatHappenedPrefix: string;
  safetyNote?: string;
  sensitive: boolean;
} {
  const assessment = assessReputationalRisk(story.title, summary);
  if (!assessment.sensitive) {
    return {
      title: story.title,
      summary,
      whatHappenedPrefix: `${sourceLabel(story)} reports this development.`,
      sensitive: false,
    };
  }

  const sources = sourceLabel(story);
  const title = assessment.alreadyAttributed
    ? story.title
    : `Report: ${story.title}`;

  return {
    title,
    summary,
    whatHappenedPrefix: `${sources} reports a reputation-sensitive allegation, accusation, legal claim, or investigation described in the linked coverage.`,
    safetyNote:
      "Fact Desk preserves attribution for allegations and other reputation-sensitive claims and does not treat source-specific accusations as independently established facts merely because multiple outlets report them.",
    sensitive: true,
  };
}
