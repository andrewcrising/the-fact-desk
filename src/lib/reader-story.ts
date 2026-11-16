import { getBoundedDiscovery } from "@/lib/discovery";
import { getStoryBySlug } from "@/lib/story-repository";
import type { Story } from "@/types/story";

interface ReaderStoryDependencies {
  getPublishedStory: (slug: string) => Promise<Story | undefined>;
  getDiscoveryStories: () => Promise<{ stories: Story[] }>;
}

const defaultDependencies: ReaderStoryDependencies = {
  getPublishedStory: getStoryBySlug,
  getDiscoveryStories: getBoundedDiscovery,
};

/**
 * Resolve a reader route from the durable editorial repository first, then
 * from the same bounded live-discovery set that generated homepage links.
 * Discovery fallback is read-only and does not publish or attest a story.
 */
export async function resolveReaderStoryBySlug(
  slug: string,
  dependencies: ReaderStoryDependencies = defaultDependencies,
): Promise<Story | undefined> {
  const published = await dependencies.getPublishedStory(slug);
  if (published) return published;

  const discovery = await dependencies.getDiscoveryStories();
  return discovery.stories.find((story) => story.slug === slug);
}
