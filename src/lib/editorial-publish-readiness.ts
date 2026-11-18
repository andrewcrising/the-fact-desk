import type { PersistedStory } from "@/types/editorial";

export interface PublishReadiness {
  ready: boolean;
  reasons: string[];
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Minimum invariant for deliberate publication. This is deliberately narrower
 * than editorial judgment: it prevents structurally incomplete drafts from
 * becoming public, while still allowing a reviewer to publish a carefully
 * qualified low-evidence or single-source briefing when that is warranted.
 */
export function evaluatePublishReadiness(story: PersistedStory): PublishReadiness {
  const reasons: string[] = [];

  if (!hasText(story.title)) reasons.push("missing title");
  if (!hasText(story.summary)) reasons.push("missing summary");
  if (!hasText(story.whatHappened)) reasons.push("missing what happened");
  if (!hasText(story.whyItMatters)) reasons.push("missing why it matters");

  if (story.storySources.length === 0) {
    reasons.push("no attached sources");
  } else if (story.storySources.some((source) => !isHttpUrl(source.url))) {
    reasons.push("invalid source URL");
  }

  const qualifiedEvidence =
    story.confidence === "Single-source" ||
    story.confidence === "Developing" ||
    story.confidence === "Disputed" ||
    story.evidenceLevel === "Low";
  if (qualifiedEvidence && !hasText(story.uncertaintyNote)) {
    reasons.push("thin or disputed evidence requires an uncertainty note");
  }

  return { ready: reasons.length === 0, reasons };
}

export function assertStoryReadyForPublish(story: PersistedStory): void {
  const result = evaluatePublishReadiness(story);
  if (!result.ready) {
    throw new Error(`Story is not ready to publish: ${result.reasons.join("; ")}`);
  }
}
