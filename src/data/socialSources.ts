import type { StoryCategory } from "@/types/story";

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
  | BlueskyAuthorSourceConfig
  | MastodonTagSourceConfig;

function envList(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 24);
}

/**
 * Social ingestion is deliberately opt-in. No paid API or credential is
 * required for the initial Bluesky/Mastodon adapters, but production should
 * not start consuming social data until the source list is intentionally
 * curated and reviewed.
 *
 * Example:
 * FACT_DESK_SOCIAL_SIGNALS=1
 * FACT_DESK_BLUESKY_ACTORS=nasa.gov,example.com
 * FACT_DESK_MASTODON_TAGS=breakingnews,earthquake
 */
export function getEnabledSocialSources(): SocialSourceConfig[] {
  if (process.env.FACT_DESK_SOCIAL_SIGNALS !== "1") return [];

  const bluesky = envList("FACT_DESK_BLUESKY_ACTORS").map(
    (actor): BlueskyAuthorSourceConfig => ({
      id: `bluesky-${actor.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      provider: "bluesky-author",
      actor,
      directSource: false,
    }),
  );

  const mastodon = envList("FACT_DESK_MASTODON_TAGS").map(
    (tag): MastodonTagSourceConfig => ({
      id: `mastodon-tag-${tag.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      provider: "mastodon-tag",
      host: "mastodon.social",
      tag: tag.replace(/^#/, ""),
      directSource: false,
    }),
  );

  return [...bluesky, ...mastodon].slice(0, 32);
}
