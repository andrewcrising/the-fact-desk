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

The initial implementation uses no paid API:

- Bluesky author feeds through the public Bluesky AppView API.
- Mastodon hashtag timelines from the allowlisted `mastodon.social` public API when that instance permits public preview.

X is intentionally not wired to a paid credential or scraping workaround. The provider-neutral evidence model can accept an X adapter later after API economics, terms, and access are deliberately approved.

## Activation

Social ingestion is off by default.

```text
FACT_DESK_SOCIAL_SIGNALS=1
FACT_DESK_BLUESKY_ACTORS=handle.example,another.example
FACT_DESK_MASTODON_TAGS=breakingnews,earthquake
```

Lists are bounded and fetched with short timeouts and source-level failure isolation. The adapter only calls exact allowlisted HTTPS API hosts; arbitrary user-supplied fetch URLs are not accepted.

Use `/api/social-preview` to inspect ranked signals before enabling them in the main live desk. `/api/live-preview?fresh=1` includes social diagnostics when the feature is enabled.

## Ranking

Social rank is a deterministic discovery score based on freshness plus bounded/log-scaled likes, reposts, replies, and quotes. The score is explicitly **not a truth score**. Engagement never changes Fact Desk confidence by itself.

## Editorial boundary

Do not add an account simply because it is popular or politically useful. Prefer accounts that have a clear reason to be monitored: direct participants, primary institutions, established beat reporters, domain experts, credible local observers, or consistently high-signal specialist sources. Maintain viewpoint and geographic diversity without treating representation as evidence quality.
