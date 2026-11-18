# Deployment checklist

Use this checklist to run The Fact Desk as a usable MVP:

`RSS ingest -> admin inbox -> promote to draft -> edit -> publish -> homepage -> story detail`

## 1. Create Supabase project

1. Create a Supabase project.
2. Open **SQL Editor**.
3. Run `supabase/schema.sql`.
4. Confirm these tables exist:
   - `sources`
   - `feed_items`
   - `stories`
   - `story_sources`
   - `editorial_selections`
   - `subscribers`

## 2. Configure env vars

Required for durable MVP mode:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_API_TOKEN=long-random-editorial-token
CRON_SECRET=long-random-cron-token
```

Optional:

```bash
NEXT_PUBLIC_SHOW_LIVE_BETA=false
NEXT_PUBLIC_USE_RSS_CACHE=false
NEXT_PUBLIC_USE_MERGED_STORIES=false
ALLOW_MOCK_FALLBACK=false
AI_DRAFT_ASSIST_ENABLED=false
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
FACT_DESK_AUTOMATION_MODE=auto_draft
FACT_DESK_HEALTH_AUTO_PUBLISH_ENABLED=false
```

Production recommendation: leave `ALLOW_MOCK_FALLBACK` unset or `false`.
Enable AI Draft Assist only for admin use after confirming editorial guardrails.
Recommended first production automation mode is `auto_draft`; do not enable
`guarded_auto_publish` until real dry runs are reviewed.

## 3. Seed demo data

After env vars are available locally:

```bash
npm install
npm run seed
```

The seed is idempotent. It upserts:

- 10 initial RSS sources
- 3 published demo stories
- 1 draft demo story
- 5 `new` feed inbox items

It dedupes by:

- `sources.feed_url`
- `stories.slug`
- `feed_items.dedupe_key`
- `story_sources(story_id, url)`

## 4. Run locally

```bash
npm run dev
```

Open:

- `/` for public homepage
- `/admin` for editorial tools

Paste `ADMIN_API_TOKEN` into admin pages when prompted.

## 5. Manual lifecycle test

1. Visit `/` and confirm seeded published stories appear.
2. Visit `/admin`.
3. Open **Feed Inbox**.
4. Click **Run RSS ingest**.
5. Click **Create draft from item** on a feed item.
6. Open **Stories**.
7. Edit the new draft.
8. Set confidence, evidence level, coverage angle, and uncertainty note.
9. Add or verify source lines.
10. Click **Save draft**.
11. Click **Publish**.
12. Optionally set homepage rank and click **Set as lead**.
13. Visit `/`.
14. Confirm the story appears publicly with confidence/evidence/source context.
15. Click the story and confirm `/story/[slug]` renders.
16. Archive the story and confirm it leaves the public homepage.

## 6. Vercel deployment

1. Import the repo into Vercel.
2. Add all required env vars.
3. Deploy.
4. Run `npm run seed` locally against the same Supabase project, or seed through your deployment workflow.
5. Confirm `/admin` warns if any required env var is missing.

Deployments must remain side-effect-free: do not run RSS ingest, create drafts,
or write smoke-test records from `prebuild`/`build`. Trigger the protected
automation endpoint explicitly after the Preview reports READY.

## 7. Vercel Cron

Preview deployment note: scheduled cron is currently disabled so Hobby/preview
deployments can build successfully. The protected automation endpoint remains
available for manual triggering:

```bash
POST /api/automation/run-briefing-pipeline
GET /api/automation/run-briefing-pipeline?dry_run=true
```

`/api/automation/run-briefing-pipeline` supports GET for Vercel Cron and POST
for manual/admin calls. Both require:

```bash
Authorization: Bearer <CRON_SECRET or ADMIN_API_TOKEN>
```

To re-enable scheduled automation later, add `vercel.json` with a plan-safe
schedule. Hobby plans are limited to once daily, for example:

```json
{
  "crons": [
    {
      "path": "/api/automation/run-briefing-pipeline",
      "schedule": "0 1 * * *"
    }
  ]
}
```

Use a more frequent schedule only on a plan that supports it.

## 7a. GitHub Actions automation schedule

For Vercel Hobby without Pro cron, use the GitHub Actions workflow:

```bash
.github/workflows/fact-desk-automation.yml
```

Set GitHub repository secrets:

```bash
FACT_DESK_SITE_URL=https://your-vercel-domain.vercel.app
FACT_DESK_CRON_SECRET=<same value as Vercel CRON_SECRET>
```

The workflow runs every 2 hours and can also be run manually from GitHub:

1. GitHub repo -> Actions.
2. Select **Fact Desk Automation**.
3. Click **Run workflow**.
4. Confirm results in `/admin/automation`.

Keep `FACT_DESK_AUTOMATION_MODE=auto_draft` for first production use so the
pipeline creates/updates drafts without auto-publishing.

## 8. Verification commands

```bash
npm run test
npm run lint
npm run build
```

## 9. Supabase integration tests

Integration tests are skipped by default during `npm run test`. To run them
against a disposable Supabase test project:

```bash
export NODE_ENV=test
export RUN_INTEGRATION_TESTS=true
export SUPABASE_TEST_URL=https://your-test-project.supabase.co
export SUPABASE_TEST_SERVICE_ROLE_KEY=your-test-service-role-key
export SUPABASE_TEST_ALLOW_REMOTE=true
npm run test:integration
```

Safety guardrails:

- tests skip unless `RUN_INTEGRATION_TESTS=true`
- tests skip with `NODE_ENV=production`
- tests require `SUPABASE_TEST_URL` and `SUPABASE_TEST_SERVICE_ROLE_KEY`
- remote Supabase URLs require `SUPABASE_TEST_ALLOW_REMOTE=true`
- if `SUPABASE_TEST_URL` equals `NEXT_PUBLIC_SUPABASE_URL`, tests skip unless `SUPABASE_TEST_ALLOW_SHARED_DATABASE=true`
- test records are prefixed with a unique run ID and cleaned up at the end

The integration test covers:

- source creation
- feed item insert and duplicate dedupe
- feed item promotion to draft
- editorial selection and story source linkage
- draft edit
- publish and public story queries
- homepage ordering with `is_lead` and `homepage_rank`
- story detail lookup
- archive and public exclusion
- newsletter validation/honeypot/duplicate handling
- protected route rejection for missing/invalid tokens

## 10. Production smoke test after Vercel deploy

After deployment:

1. Confirm Vercel env vars are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_API_TOKEN`
   - `CRON_SECRET`
2. Confirm `ALLOW_MOCK_FALLBACK` is unset or `false`.
3. Visit `/` and confirm the public desk loads without mock fallback copy.
4. Visit `/admin`.
5. Enter `ADMIN_API_TOKEN`.
6. Open Feed Inbox.
7. Click **Run RSS ingest**.
8. Promote one feed item into a draft.
9. Open Stories and edit the draft.
10. Confirm confidence, evidence level, uncertainty note, and source list are set.
11. Publish it.
12. Confirm it appears on `/` with evidence/source context.
13. Click the story and confirm `/story/[slug]` works.
14. Archive the story.
15. Confirm it disappears from the public homepage.
16. Submit a test newsletter signup.
17. Confirm `/api/automation/run-briefing-pipeline` rejects a request without bearer auth.
18. Confirm `/api/automation/run-briefing-pipeline?dry_run=true` accepts `Authorization: Bearer <CRON_SECRET>`.
19. Confirm Vercel Cron is configured to call durable automation route `/api/automation/run-briefing-pipeline`.
20. Visit `/admin/automation`.
21. Confirm the current automation mode.
22. Run **Dry run pipeline** and review report warnings.
23. Do not enable `guarded_auto_publish` until dry runs and audit logs are reviewed.

## 11. Operational safety notes

- Never set `ALLOW_MOCK_FALLBACK=true` in production.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` client-side.
- Rotate `ADMIN_API_TOKEN` before public launch.
- Use real auth before giving access to additional editors.
- Move rate limiting to a durable provider before meaningful traffic.
- Add a real email provider before promising Daily Brief delivery.

## Known limitations

- Admin uses a bearer token pasted into the browser; replace with real auth before broader editorial rollout.
- Newsletter signup stores emails but does not send email yet.
- Rate limiting is in-memory MVP protection and should move to durable KV/WAF for production scale.
- Feed clustering is manual; multiple source attachment is supported but not automated.
- Sidebar live signals, source watchlist, correction log, and Health Desk topic lanes are labeled beta/demo until backed by database views.
