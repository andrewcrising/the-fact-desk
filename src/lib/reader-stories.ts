import { safeArticleUrl } from "@/lib/article-source-links";
import type { Story } from "@/types/story";

function identities(story: Story): string[] {
  const keys = [`id:${story.id}`, `slug:${story.slug}`];
  for (const value of story.sourceUrls ?? []) {
    const safe = safeArticleUrl(value);
    if (!safe) continue;
    const url = new URL(safe);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    keys.push(`url:${url.href}`);
  }
  return keys;
}

/** Preserve the first ranked story and never repeat any attached article. */
export function deduplicateReaderStories(stories: Story[], excluded: Story[] = []): Story[] {
  const seen = new Set(excluded.flatMap(identities));
  return stories.filter((story) => {
    const keys = identities(story);
    if (keys.some((key) => seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });
}
