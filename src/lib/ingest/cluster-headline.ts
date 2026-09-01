import type { Story, StoryCategory } from "@/types/story";

const HEADLINE_STOP_WORDS = new Set([
  "about", "after", "again", "against", "amid", "and", "are", "but", "for",
  "from", "has", "have", "into", "more", "new", "not", "over", "people", "says",
  "say", "that", "the", "their", "this", "with", "will", "your", "first", "thing",
  "live", "updates", "update", "breaking", "analysis", "opinion",
]);

function normalizeToken(token: string): string {
  return token
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");
}

function canonicalToken(token: string): string {
  const normalized = normalizeToken(token).toLowerCase();
  if (normalized.length > 4 && normalized.endsWith("ies")) {
    return `${normalized.slice(0, -3)}y`;
  }
  if (normalized.length > 4 && normalized.endsWith("s") && !normalized.endsWith("ss")) {
    return normalized.slice(0, -1);
  }
  return normalized;
}

function eligible(token: string): boolean {
  const canonical = canonicalToken(token);
  return canonical.length > 3 && !HEADLINE_STOP_WORDS.has(canonical);
}

function categoryLabel(category: StoryCategory): string {
  return category === "World" ? "World briefing" : `${category} briefing`;
}

/**
 * Build a neutral Fact Desk headline for a multi-source cluster using only
 * meaningful terms independently present in at least two clustered headlines.
 * This prevents the cluster from inheriting one publisher's headline or framing.
 */
export function buildIndependentClusterHeadline(
  stories: Story[],
  category: StoryCategory,
): string {
  if (stories.length < 2) return stories[0]?.title ?? `${categoryLabel(category)} update`;

  const counts = new Map<string, number>();
  const display = new Map<string, string>();

  for (const story of stories) {
    const seen = new Set<string>();
    for (const rawToken of story.title.split(/\s+/)) {
      if (!eligible(rawToken)) continue;
      const canonical = canonicalToken(rawToken);
      if (!canonical || seen.has(canonical)) continue;
      seen.add(canonical);
      counts.set(canonical, (counts.get(canonical) ?? 0) + 1);
      if (!display.has(canonical)) display.set(canonical, normalizeToken(rawToken));
    }
  }

  const representative = [...stories].sort(
    (a, b) => b.title.length - a.title.length,
  )[0];
  const orderedShared: string[] = [];
  const used = new Set<string>();

  for (const rawToken of representative?.title.split(/\s+/) ?? []) {
    if (!eligible(rawToken)) continue;
    const canonical = canonicalToken(rawToken);
    if (used.has(canonical) || (counts.get(canonical) ?? 0) < 2) continue;
    used.add(canonical);
    orderedShared.push(display.get(canonical) ?? normalizeToken(rawToken));
    if (orderedShared.length >= 7) break;
  }

  if (orderedShared.length < 2) {
    const fallback = Array.from(counts.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
      .map(([term]) => display.get(term) ?? term);
    orderedShared.push(...fallback.filter((term) => !orderedShared.includes(term)));
  }

  const subject = orderedShared.slice(0, 7).join(" ").trim();
  const headline = subject
    ? `${categoryLabel(category)}: ${subject}`
    : `${categoryLabel(category)}: related development across multiple sources`;

  return stories.some(
    (story) => story.title.trim().toLowerCase() === headline.trim().toLowerCase(),
  )
    ? `${categoryLabel(category)}: developing multi-source story`
    : headline;
}
