# Deploy The Fact Desk to Cloudflare Workers

Repo: **https://github.com/andrewcrising/the-fact-desk**

Cloudflare Workers is the canonical deployment target for the low-cost pilot. Vercel may remain connected temporarily as a fallback until the Cloudflare preview is validated.

## Current deployment shape

- App: Next.js 16 + vinext on Cloudflare Workers
- Database: existing dedicated Supabase **The Fact Desk** project
- Production branch: `main`
- Validation branch: `chatgpt/fact-desk-recovery`
- Worker name: `the-fact-desk`
- `workers.dev` and version preview URLs: enabled

The repository keeps the original Next.js build working alongside vinext. CI must pass both builds before promotion.

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

Add these to the Worker before the real data smoke test:

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

Security rules:

- Store `SUPABASE_SECRET_KEY`, `ADMIN_API_TOKEN`, and `CRON_SECRET` as encrypted Worker secrets.
- Never commit secret values to GitHub.
- The Supabase server key must never be exposed to browser code.
- Keep `auto_draft` during pilot validation. Do not enable guarded auto-publish yet.

## Required validation before production

A recovery-branch deployment is considered green only after all of the following pass:

1. GitHub CI passes unit tests and lint.
2. The original Next.js production build passes.
3. The vinext/Cloudflare Worker build passes.
4. Wrangler bundle dry-run passes.
5. Recovery preview loads successfully.
6. Durable Supabase RSS ingest produces real `feed_items`.
7. Automation produces drafts and story-source links.
8. Evidence Assist completes without destructive source replacement.
9. `stories_auto_published` remains `0` in `auto_draft` mode.
10. At least one reviewed preview draft can be deliberately published and rendered correctly on the preview homepage.

Only after those checks should PR #5 be made ready for review and merged to `main`.

## Local commands

```bash
npm ci
npm test
npm run lint
npm run build
npm run build:vinext
npm run dev:vinext
```

Cloudflare bundle validation without deploying:

```bash
npx wrangler deploy --dry-run --config dist/server/wrangler.json
```

## Scheduling

Do not turn on recurring ingestion until the one-time end-to-end preview smoke test is green. Once validated, use Cloudflare Cron Triggers or another protected scheduler to invoke the automation path. The scheduler must authenticate with `CRON_SECRET`, and the pilot should remain in `auto_draft` mode.

## Vercel fallback

Do not delete the existing Vercel project until the Cloudflare deployment is proven. No new Vercel paid subscription is required for this migration. Once Cloudflare has passed the full smoke test and production deployment is stable, Vercel can be disconnected or retained only as an inactive fallback.
