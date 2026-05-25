import type { StoryCategory } from "@/types/story";

export const STORY_CATEGORIES: StoryCategory[] = [
  "Politics",
  "Markets",
  "Technology",
  "World",
  "Health",
  "Courts",
  "Energy",
  "Culture",
];

export const NAV_LINKS = STORY_CATEGORIES.map((category) => ({
  label: category,
  href: `/?category=${encodeURIComponent(category)}`,
}));
