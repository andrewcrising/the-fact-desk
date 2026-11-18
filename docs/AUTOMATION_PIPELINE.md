# Automation pipeline

The Fact Desk is moving toward a self-updating briefing service while preserving
evidence standards and manual override.

The automation pipeline is a foundation, not a fully autonomous newsroom.

## Automation modes

Configure with:

```bash
FACT_DESK_AUTOMATION_MODE=manual_review
```

Supported modes:

### `manual_review`

Default. Current safety-first behavior.

- RSS/feed items are ingested.
- Existing admin workflow remains primary.
- Pipeline dry runs and reports clusters.
- No automated draft creation or publishing.

### `auto_draft`

- Ingests RSS/feed items.
- Clusters related feed items.
- Creates or updates draft stories.
- Runs Evidence Assist.
- Optionally uses AI Draft Assist if enabled.
- Does not publish.

### `guarded_auto_publish`

Experimental.

- Does everything in `auto_draft`.
- Publishes only when guarded thresholds pass.
- Weak, disputed, health, or uncertain stories remain draft/review.

Do not enable this mode until source extraction, scoring, audit logs, and safety
checks are verified.

### `full_auto_briefing`

Future mode only. Not implemented.

## Health auto-publish

Health stories never auto-publish by default.

```bash
FACT_DESK_HEALTH_AUTO_PUBLISH_ENABLED=false
```

Only enable this after health-specific source extraction, medical-safety review,
and editorial policy are mature.

## Pipeline steps

`POST /api/automation/run-briefing-pipeline`

1. ingest RSS/feed sources
2. normalize and dedupe feed items
3. cluster related feed items
4. create or update draft stories, depending on mode
5. attach feed items/sources
6. run Evidence Assist
7. optionally run AI Draft Assist if configured
8. evaluate guarded publish policy
9. publish only if mode and policy allow
10. record automation run audit data

The route supports:

```bash
POST /api/automation/run-briefing-pipeline
GET /api/automation/run-briefing-pipeline
POST /api/automation/run-briefing-pipeline?dry_run=true
```

All calls require:

```bash
Authorization: Bearer <ADMIN_API_TOKEN or CRON_SECRET>
```

## Pipeline report

The route returns:

```json
{
  "feeds_checked": 0,
  "feed_items_seen": 0,
  "new_feed_items": 0,
  "duplicates_skipped": 0,
  "clusters_created": 0,
  "drafts_created": 0,
  "drafts_updated": 0,
  "stories_auto_published": 0,
  "stories_needing_review": 0,
  "errors": [],
  "warnings": []
}
```

## Guarded auto-publish thresholds

A story may auto-publish only when:

- mode is `guarded_auto_publish`
- at least two unique sources OR one official/primary source exists
- no severe Evidence Assist warnings exist
- AI Draft Assist returned no `claims_to_verify`
- evidence level is `Moderate` or `Strong`
- confidence is `Developing` or `Confirmed`
- source links are attached
- summary, what happened, and why it matters are present
- uncertainty note exists for developing/disputed stories
- category is not Health unless health auto-publish is explicitly enabled

Otherwise the story remains draft/review.

## Clustering

Initial clustering is deterministic:

- canonical URL match
- normalized title similarity
- shared key terms
- likely category from feed metadata when available
- unique source domains

No AI clustering is used yet.

## Admin monitoring

Use `/admin/automation` to see:

- current automation mode
- health auto-publish state
- recent automation runs
- errors/warnings
- dry-run button
- run-pipeline button

Manual admin story editing and publishing remains available as override.

## Cron

`vercel.json` calls:

```json
{
  "path": "/api/automation/run-briefing-pipeline",
  "schedule": "0 */1 * * *"
}
```

Adjust the schedule in `vercel.json`. For early MVP testing, hourly is
reasonable; daily is safer for low-volume review.

## Safety limits

- No auto-publish in default mode.
- No Health auto-publish by default.
- Public homepage still reads only published stories.
- Manual review and archive remain available.
- AI Draft Assist remains source-grounded and does not publish.
