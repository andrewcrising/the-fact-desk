# Deploy The Fact Desk to Cloudflare Workers

Repo: **https://github.com/andrewcrising/the-fact-desk**

Cloudflare Workers is the canonical deployment target for the low-cost pilot. Vercel may remain connected temporarily as an inactive fallback, but the production automation path must not depend on Vercel Cron.

## Current deployment shape

- App: Next.js 16 + vinext on Cloudflare Workers
- Database: dedicated Supabase **The Fact Desk** project
- Production branch: `main`
- Validation branch: `chatgpt/fact-desk-recovery`
- Worker name: `the-fact-desk`
- `workers.dev` and version preview URLs: enabled
- Durable published stories: Supabase
- Direct RSS/social preview: discovery/diagnostic only; it does not replace the reviewed desk

The repository keeps the original Next.js build working alongside vinext. CI must pass both builds plus the Wrangler bundle gate before promotion.

## One-time Cloudflare Git connection

In Cloudflare:

1. Workers & Pages → **Create application** → **Import a repository**.
2. Authorize the Cloudflare Workers & Pages GitHub app for `andrewcrising/the-fact-desk` only.
3. Select repository `andrewcrising/the-fact-desk`.
4. Set the Worker/project name to **`the-fact-desk`**. It must match `wrangler.jsonc`.
5. Use production branch **`main`**.
6. Build command: `npm run build:vinext`
7. Deploy command: `npm run deploy:vinext`
8. Enable builds for non-production branches so `chatgpt/fact-desk-recovery` receives preview deployments.
9. Save the project. Do not promote the recovery branch to production yet.

## Required runtime variables

Add these to the recovery preview before the real-data smoke test:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SECRET_KEY
ADMIN_API_TOKEN
CRON_SECRET
ALLOW_MOCK_FALLBACK=false
FACT_DESK_AUTOMATION_MODE=auto_draft
FACT_DESK_HEALTH_AUTO_PUBLISH_ENABLED=false
NEXT_PUBLIC_SHOW_LIVE_BETA=false
AI_DRAFT_ASSIST_ENABLED=false
```

Optional non-legacy discovery can remain off for the backend proof. When deliberately enabled later:

```text
FACT_DESK_SOCIAL_SIGNALS=1
FACT_DESK_X_BEARER_TOKEN=<server-only secret>
```

Security rules:

- Store `SUPABASE_SECRET_KEY`, `ADMIN_API_TOKEN`, `CRON_SECRET`, and any X bearer token as encrypted Worker secrets.
- Never commit secret values to GitHub.
- The Supabase server key must never be exposed to browser code.
- Keep `auto_draft` during pilot validation. Do not enable guarded auto-publish yet.
- Do not configure a second recurring scheduler. The database rejects overlapping mutating automation runs and expires stale run claims after 30 minutes.

## Required validation before production

A recovery-branch deployment is considered green only after all of the following pass:

1. Exact recovery head passes unit tests and lint.
2. Original Next.js production build passes.
3. vinext/Cloudflare Worker build passes.
4. Wrangler bundle dry-run passes.
5. Recovery preview loads successfully with `ALLOW_MOCK_FALLBACK=false`.
6. Send one authenticated `POST /api/automation/run-briefing-pipeline` with `{"dry_run":false}`. Do not use GET for writes; GET is forcibly dry-run/read-only.
7. Durable Supabase RSS ingest produces real `feed_items`.
8. `auto_draft` produces drafts and `story_sources`, with accumulated evidence preserved across repeat coverage.
9. The automation run record completes and `stories_auto_published` remains exactly `0`.
10. Review one generated draft in `/admin`, correct/expand it as needed, and deliberately publish it.
11. The published story appears on the preview homepage on the next request and its dynamic `/story/<slug>` route renders with valid source links.
12. Re-run security advisor, performance advisor, feed-health, and exact-head CI checks.

Only after those checks should PR #5 be marked ready for review and merged to `main`.

## Smoke-test evidence to record

Capture the following from the single proof run so the gate is reproducible rather than visual-only:

```text
preview URL
recovery commit SHA
automation run ID
feeds_checked
new_feed_items
clusters_created
drafts_created
drafts_updated
stories_auto_published
stories_needing_review
reviewed/published story ID + slug
```

The database should show non-zero `feed_items`, `stories`, and `story_sources`, while `stories_auto_published` remains zero during `auto_draft` validation.

## Local / CI commands

```bash
npm ci
npm test
npm run lint
npm run build
npm run build:vinext
npx wrangler deploy --dry-run --config dist/server/wrangler.json
```

## Scheduling after the proof run

Do **not** turn on recurring ingestion until the one-time end-to-end preview smoke test is green. Once validated, use one of these protected scheduler paths:

- Cloudflare Cron Trigger invoking the protected automation endpoint, or
- the existing GitHub Actions scheduler in `.github/workflows/fact-desk-automation.yml`.

Whichever scheduler is chosen must authenticate with `CRON_SECRET`. Keep the pilot in `auto_draft` until reviewed production evidence supports a later policy change.

## Vercel fallback

The old Vercel cron path is not part of the production design. No Vercel paid subscription is required for this migration. The existing Vercel project may remain inactive as a rollback reference until Cloudflare is proven, then can be disconnected or retained only as an inactive fallback.
