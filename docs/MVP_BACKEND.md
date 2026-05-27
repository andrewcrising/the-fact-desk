# The Fact Desk MVP backend

The MVP backend turns the app from a mock desk into an editorial workflow:

`raw RSS/feed item -> editorial inbox candidate -> draft story -> published story -> archived/corrected story`

## Required environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_API_TOKEN=choose-a-long-random-admin-token
CRON_SECRET=choose-a-long-random-cron-token
ALLOW_MOCK_FALLBACK=false
AI_DRAFT_ASSIST_ENABLED=false
OPENAI_API_KEY=optional-openai-key
OPENAI_MODEL=gpt-4o-mini
FACT_DESK_AUTOMATION_MODE=manual_review
FACT_DESK_HEALTH_AUTO_PUBLISH_ENABLED=false
```

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it in browser code.
- `ADMIN_API_TOKEN` protects editorial write/admin APIs.
- `CRON_SECRET` protects scheduled ingest/revalidation APIs.
- `AI_DRAFT_ASSIST_ENABLED` and `OPENAI_API_KEY` enable admin-only AI Draft Assist.
- `FACT_DESK_AUTOMATION_MODE` controls the self-updating pipeline. Default is `manual_review`.
- `FACT_DESK_HEALTH_AUTO_PUBLISH_ENABLED` must remain false unless health auto-publish has been explicitly approved.
- Without Supabase env vars, public pages fall back to `src/data/stories.ts` only in development or when `ALLOW_MOCK_FALLBACK=true`.

## Database setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase/schema.sql`.
4. Add the env vars above locally and in Vercel.

The schema creates:

- `sources`
- `feed_items`
- `stories`
- `story_sources`
- `editorial_selections`
- `subscribers`

Stories include editorial posture fields for evidence-ranked publishing:

- `confidence`
- `evidence_level`
- `signal`
- `coverage_angle`
- `uncertainty_note`

## Local workflow

```bash
npm install
npm run seed
npm run dev
```

Open `/admin`, paste `ADMIN_API_TOKEN`, then:

1. Go to `/admin/feed-inbox`.
2. Click **Ingest RSS**.
3. Promote a feed item into a draft story.
4. Edit the draft at `/admin/stories`.
5. Attach or adjust sources.
6. Publish the story.
7. Visit `/` and click the published briefing.

## API overview

Public:

- `GET /api/stories`
- `GET /api/stories/[id-or-slug]`
- `POST /api/newsletter/signup`

Admin protected:

- `POST /api/stories`
- `PATCH /api/stories/[id]`
- `POST /api/stories/[id]/publish`
- `POST /api/stories/[id]/archive`
- `POST /api/stories/[id]/promote`
- `POST /api/stories/[id]/evidence-assist`
- `POST /api/stories/[id]/draft-assist`
- `POST /api/automation/run-briefing-pipeline`
- `GET /api/feed-items`
- `PATCH /api/feed-items/[id]`
- `POST /api/feed-items/[id]/promote`

Admin or cron protected:

- `POST /api/ingest/rss`
- `GET /api/automation/run-briefing-pipeline`
- `GET /api/cron/revalidate-live`
- `GET /api/live-preview?fresh=1`

Use:

```bash
Authorization: Bearer <ADMIN_API_TOKEN or CRON_SECRET>
```

## RSS ingest behavior

`POST /api/ingest/rss` fetches active feeds from `src/data/rssFeeds.ts`, normalizes items, writes `feed_items`, and dedupes by source, canonical URL/title, and publication date. It never publishes stories directly.

The response includes:

- feeds checked
- items found
- new items inserted
- duplicates skipped
- feed errors

## Automation pipeline

See [AUTOMATION_PIPELINE.md](./AUTOMATION_PIPELINE.md).

The pipeline can ingest, cluster, draft, score, and optionally guarded-publish
stories depending on `FACT_DESK_AUTOMATION_MODE`.

Default mode is `manual_review`, which keeps publishing human-reviewed.

## Evidence Assist

`POST /api/stories/[id]/evidence-assist` calculates deterministic editorial
assist metadata from attached `story_sources`, related `feed_items`, and
`sources.source_type`.

It returns:

- source count and unique source count
- primary/official source detection
- source spread
- suggested evidence level
- suggested confidence
- coverage status suggestion
- under-covered indicator
- internal evidence score
- explanation and warnings

The route is admin-protected and read-only. It does not update story fields and
does not publish stories. Editors explicitly apply suggestions in the admin UI.

## AI Draft Assist

`POST /api/stories/[id]/draft-assist` is admin-protected and disabled unless:

```bash
AI_DRAFT_ASSIST_ENABLED=true
OPENAI_API_KEY=...
```

It loads:

- current story fields
- attached story sources
- related feed items
- Evidence Assist profile

It returns structured draft suggestions only:

- summary
- what happened
- why it matters
- coverage angle
- uncertainty note
- confidence rationale
- source spread explanation
- editorial warnings
- claims to verify
- metadata limitations

The route does not mutate stories and cannot publish. Editors must explicitly
apply suggestions, save the draft, and publish separately. Public pages never
show raw AI output.

## Public rendering behavior

Public homepage and story detail pages read published stories through `src/lib/story-repository.ts`.

Fallback behavior:

- If Supabase is missing or unavailable, the public UI uses `src/data/stories.ts`.
- Raw `feed_items` and draft stories never appear publicly.
- Live RSS beta remains a separate external-link preview unless explicitly shown by env flag.

## Seed data

Run:

```bash
npm run seed
```

The seed script is idempotent and creates initial RSS sources, demo published
stories, one draft story, and inbox feed items for the admin workflow.

## Integration tests

Supabase-backed integration tests are opt-in and skipped by default:

```bash
export NODE_ENV=test
export RUN_INTEGRATION_TESTS=true
export SUPABASE_TEST_URL=https://your-test-project.supabase.co
export SUPABASE_TEST_SERVICE_ROLE_KEY=your-test-service-role-key
export SUPABASE_TEST_ALLOW_REMOTE=true
npm run test:integration
```

Do not point `SUPABASE_TEST_URL` at production. The tests write records with a
unique run ID and clean them up afterward.

## Vercel deployment

1. Add the Supabase/admin/cron env vars in Vercel.
2. `vercel.json` schedules `GET /api/ingest/rss` hourly. The route also supports `POST` for manual calls.
3. Keep `NEXT_PUBLIC_SHOW_LIVE_BETA=false` for the clean MVP unless you want the raw external-link beta preview.

## Remaining post-MVP work

- Replace browser-entered admin token with real auth.
- Add story clustering across multiple feed items.
- Add richer source credibility scoring and surface it from real data.
- Connect sidebar live signals/corrections to published/corrected stories.
- Add server-side rate limiting for newsletter signup and admin APIs.
