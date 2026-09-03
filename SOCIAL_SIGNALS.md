# Social signal evidence lane

The Fact Desk treats public social/open-web activity as a **discovery signal**, not as equivalent evidence to independent reporting or primary records.

## Evidence rules

- Social-only stories remain `Single-source` and cannot become the automatic lead.
- Social sources do not increase `independentEvidenceSourceCount`.
- One publisher plus many social posts is still one independent publisher source.
- Two independent publisher/primary sources can establish cross-angle coverage; social material may then add context without increasing the independent count.
- Social-only story priority is capped below the `Major` threshold so virality, engagement, or alarming wording cannot manufacture editorial urgency.
- Public cards are visibly marked `Social signal · unverified`.
- Original social links are preserved. Public Fact Desk copy uses an attributed keyword-based synopsis rather than silently adopting a post as Fact Desk factual voice.

## Providers

X is the primary initial provider.

The adapter uses the official X API v2 News Search endpoint, which is designed to surface breaking-news/headline clusters from activity on X. It requires a server-side bearer token. The token is never placed in browser payloads, source URLs, logs, or public diagnostics.

The initial X implementation deliberately:

- uses exact `https://api.x.com` host allowlisting;
- uses bounded queries and result counts;
- requests only the fields needed to identify a cluster, its update time, and a representative underlying post;
- links readers to an underlying X post for original context;
- does not republish X-generated summaries/hooks as Fact Desk prose;
- treats the X cluster as social discovery context, never as independent verification;
- performs no request when the feature flag, bearer token, or query list is absent.

Mastodon remains an optional secondary provider. A Bluesky adapter remains in the codebase only as dormant compatibility code and is not enabled by the initial source configuration.

## Activation

Social ingestion is off by default. Enabling the feature alone does not cause X usage unless credentials and explicit queries are also configured.

```text
FACT_DESK_SOCIAL_SIGNALS=1
FACT_DESK_X_BEARER_TOKEN=<server-only secret>
FACT_DESK_X_NEWS_QUERIES=breaking news,politics,markets,technology,health
FACT_DESK_MASTODON_TAGS=earthquake
```

X currently documents its API as pay-per-use. Do not add credits or enable production X queries without an explicit cost decision. Query lists are bounded so activation cannot silently fan out into an unbounded request matrix.

Use `/api/social-preview` to inspect ranked signals before enabling them in the main live desk. `/api/live-preview?fresh=1` includes social diagnostics when the feature is enabled.

## Ranking

Social rank is a deterministic **discovery** score, not a truth score. Engagement, X clustering, repetition, and recency never change Fact Desk confidence by themselves. X News already supplies a curated breaking-news cluster order; Fact Desk additionally applies freshness controls and the same evidence firewall used for all social signals.

## Editorial boundary

Social discovery should broaden what the desk can see, not outsource editorial judgment to any platform. A trend or X news cluster can trigger monitoring, but a claim becomes stronger only when supported by primary records or genuinely independent reporting. Maintain viewpoint and geographic diversity without treating representation, popularity, verification badges, or platform ranking as evidence quality.
