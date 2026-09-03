import type { StoryCategory } from "@/types/story";

export interface XNewsSourceConfig {
  id: string;
  provider: "x-news";
  query: string;
  directSource: false;
  categoryHint?: StoryCategory;
}

/** Dormant compatibility adapter; intentionally not enabled. */
export interface BlueskyAuthorSourceConfig {
  id: string;
  provider: "bluesky-author";
  actor: string;
  directSource: boolean;
  categoryHint?: StoryCategory;
}

export interface MastodonTagSourceConfig {
  id: string;
  provider: "mastodon-tag";
  host: "mastodon.social";
  tag: string;
  directSource: false;
  categoryHint?: StoryCategory;
}

export type SocialSourceConfig =
  | XNewsSourceConfig
  | BlueskyAuthorSourceConfig
  | MastodonTagSourceConfig;

const DEFAULT_X_NEWS_QUERIES = [
  "breaking news",
  "politics",
  "markets",
  "technology",
  "health",
  "world",
];

function envList(name: string, max = 12): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, max);
}

/**
 * Social discovery is server-side and X-first. A bearer token is sufficient to
 * activate X using safe default news queries; FACT_DESK_SOCIAL_SIGNALS=1 can
 * additionally enable explicitly configured Mastodon tags. Bluesky remains
 * dormant. No paid X request occurs without a bearer token.
 */
export function getEnabledSocialSources(): SocialSourceConfig[] {
  const featureEnabled = process.env.FACT_DESK_SOCIAL_SIGNALS === "1";
  const xEnabled = Boolean(process.env.FACT_DESK_X_BEARER_TOKEN?.trim());
  if (!featureEnabled && !xEnabled) return [];

  const configuredXQueries = envList("FACT_DESK_X_NEWS_QUERIES", 8);
  const xQueries = configuredXQueries.length > 0
    ? configuredXQueries
    : DEFAULT_X_NEWS_QUERIES;

  const xNews = xEnabled
    ? xQueries.map(
        (query): XNewsSourceConfig => ({
          id: `x-news-${query.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48)}`,
          provider: "x-news",
          query,
          directSource: false,
        }),
      )
    : [];

  const mastodon = featureEnabled
    ? envList("FACT_DESK_MASTODON_TAGS", 8).map(
        (tag): MastodonTagSourceConfig => ({
          id: `mastodon-tag-${tag.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          provider: "mastodon-tag",
          host: "mastodon.social",
          tag: tag.replace(/^#/, ""),
          directSource: false,
        }),
      )
    : [];

  return [...xNews, ...mastodon].slice(0, 16);
}
