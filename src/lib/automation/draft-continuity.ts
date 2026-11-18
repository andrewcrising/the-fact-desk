import { storyTitleSimilarity, storyTitlesLikelySame, type StoryCluster } from "@/lib/automation/story-clustering";
import type { StoryCategory } from "@/types/story";

export interface DraftContinuityCandidate {
  id: string;
  title: string;
  category: StoryCategory;
  updatedAt?: string | null;
}

/**
 * Find the safest existing draft to continue for a newly observed cluster.
 * Unknown-category clusters are deliberately not matched across runs. Among
 * same-category title matches, the strongest lexical match wins, then the most
 * recently updated draft.
 */
export function selectContinuingDraft(
  cluster: StoryCluster,
  candidates: DraftContinuityCandidate[],
): DraftContinuityCandidate | null {
  if (cluster.likely_category === "Unknown") return null;

  return (
    candidates
      .filter(
        (candidate) =>
          candidate.category === cluster.likely_category &&
          storyTitlesLikelySame(cluster.representative_title, candidate.title),
      )
      .sort((a, b) => {
        const similarityDelta =
          storyTitleSimilarity(cluster.representative_title, b.title) -
          storyTitleSimilarity(cluster.representative_title, a.title);
        if (similarityDelta !== 0) return similarityDelta;

        const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
        const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
        if (bTime !== aTime) return bTime - aTime;
        return a.id.localeCompare(b.id);
      })[0] ?? null
  );
}
