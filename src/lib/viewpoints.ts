import type { Story } from "@/types/story";

export type ViewpointBand =
  | "left-of-center"
  | "center-mixed"
  | "right-of-center"
  | "primary-source";

const SOURCE_VIEWPOINTS: Record<string, ViewpointBand> = {
  NPR: "left-of-center",
  "The Guardian": "left-of-center",
  "The New York Times": "left-of-center",
  ProPublica: "left-of-center",
  "Fox News": "right-of-center",
  "Washington Examiner": "right-of-center",
  "The Dispatch": "right-of-center",
  "Federal Reserve": "primary-source",
  SEC: "primary-source",
  CISA: "primary-source",
  WHO: "primary-source",
  NIH: "primary-source",
  FDA: "primary-source",
  NASA: "primary-source",
  "U.S. Department of Justice": "primary-source",
  "U.S. Energy Information Administration": "primary-source",
  "International Atomic Energy Agency": "primary-source",
};

export const VIEWPOINT_BANDS: ViewpointBand[] = [
  "left-of-center",
  "center-mixed",
  "right-of-center",
  "primary-source",
];

export function getSourceViewpoint(sourceName: string): ViewpointBand {
  return SOURCE_VIEWPOINTS[sourceName] ?? "center-mixed";
}

export function viewpointTag(band: ViewpointBand): string {
  return `viewpoint:${band}`;
}

export function storyHasViewpoint(story: Story, band: ViewpointBand): boolean {
  return story.tags.includes(viewpointTag(band));
}

export function countStoriesByViewpoint(
  stories: Story[],
): Record<ViewpointBand, number> {
  return Object.fromEntries(
    VIEWPOINT_BANDS.map((band) => [
      band,
      stories.filter((story) => storyHasViewpoint(story, band)).length,
    ]),
  ) as Record<ViewpointBand, number>;
}
