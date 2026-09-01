import type { StoryCategory } from "@/types/story";

export interface XNewsSourceConfig {
  id: string;
  provider: "x-news";
  query: string;
  directSource: false;
  categoryHint?: StoryCategory;
}

/** Dormant compatibility adapter; not enabled by the initial rollout. */
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

function envList(name: string, max = 12): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, max);
}

/**
 * Social discovery is deliberately opt-in. X is the primary provider.
 * No X request is attempted unless both the social feature flag and a server-
 * side bearer token are present. Mastodon remains an optional secondary lane.
 * The Bluesky adapter is intentionally not enabled here.
 *
 * Example:
 * FACT_DESK_SOCIAL_SIGNALS=1
 * FACT_DESK_X_BEARER_TOKEN=<server-only secret>
 * FACT_DESK_X_NEWS_QUERIES=breaking news,politics,markets,technology,health
 * FACT_DESK_MASTODON_TAGS=earthquake
 */
export function getEnabledSocialSources(): SocialSourceConfig[] {
  if (process.env.FACT_DESK_SOCIAL_SIGNALS !== "1") return [];

  const xEnabled = Boolean(process.env.FACT_DESK_X_BEARER_TOKEN?.trim());
  const xNews = xEnabled
    ? envList("FACT_DESK_X_NEWS_QUERIES", 8).map(
        (query): XNewsSourceConfig => ({
          id: `x-news-${query.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48)}`,
          provider: "x-news",
          query,
          directSource: false,
        }),
      )
    : [];

  const mastodon = envList("FACT_DESK_MASTODON_TAGS", 8).map(
    (tag): MastodonTagSourceConfig => ({
      id: `mastodon-tag-${tag.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      provider: "mastodon-tag",
      host: "mastodon.social",
      tag: tag.replace(/^#/, ""),
      directSource: false,
    }),
  );

  return [...xNews, ...mastodon].slice(0, 16);
}
