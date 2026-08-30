# The Fact Desk

**News signals ranked by evidence, not outrage.**

Calm, evidence-ranked news briefing built with Next.js, TypeScript, Tailwind, Supabase, and a Cloudflare Workers deployment target.

## Commands

```bash
npm ci
npm run dev            # original Next.js local server → http://localhost:3000
npm run dev:vinext     # Cloudflare/vinext local server → http://localhost:3001
npm run build          # original Next.js production build
npm run build:vinext   # Cloudflare Workers production build
npm run test           # backend/editorial utility tests
npm run lint
npm run ingest:rss     # fetch RSS → local cache
```

## Editorial backend

The app supports a Supabase/Postgres-backed editorial lifecycle:

`raw RSS/feed item → editorial inbox candidate → draft story → published story → archived/corrected story`

The recovered backend includes deterministic clustering, source/evidence preservation across repeated automation runs, Evidence Assist, guarded automation modes, admin lifecycle tools, and evidence-first homepage ordering.

See:

- [DEPLOY.md](./DEPLOY.md) — canonical Cloudflare Workers deployment and validation path
- [docs/MVP_BACKEND.md](./docs/MVP_BACKEND.md) — schema, API routes, and backend workflow
- [docs/EDITORIAL_STANDARDS.md](./docs/EDITORIAL_STANDARDS.md) — evidence-ranking standards
- [docs/AI_DRAFT_ASSIST_PLAN.md](./docs/AI_DRAFT_ASSIST_PLAN.md) — optional AI drafting guardrails
- [docs/AUTOMATION_PIPELINE.md](./docs/AUTOMATION_PIPELINE.md) — automation modes and safety thresholds
- [docs/PREFERENCE_MODEL.md](./docs/PREFERENCE_MODEL.md) — future topic/source-balance preferences

## Required deployed environment

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SECRET_KEY=
ADMIN_API_TOKEN=
CRON_SECRET=
ALLOW_MOCK_FALLBACK=false
AI_DRAFT_ASSIST_ENABLED=false
FACT_DESK_AUTOMATION_MODE=auto_draft
FACT_DESK_HEALTH_AUTO_PUBLISH_ENABLED=false
NEXT_PUBLIC_SHOW_LIVE_BETA=false
```

`SUPABASE_SERVICE_ROLE_KEY` remains supported only as a legacy fallback. Never expose either server key to browser code or commit it to GitHub.

## Safe pilot mode

The pilot should run in `auto_draft` mode. That mode can ingest, normalize, cluster, create/update drafts, attach story sources, and run Evidence Assist, but it cannot auto-publish stories. `guarded_auto_publish` remains experimental and should stay disabled until live source grounding has been validated.

Mock content remains a development fallback only. Deployed environments should keep `ALLOW_MOCK_FALLBACK=false`.

## API routes

| Route | Purpose |
|-------|---------|
| `GET /api/test-rss` | Live single-feed fetch proof |
| `GET /api/live-preview` | Cached live-story preview |
| `GET /api/live-preview?fresh=1` | Protected on-demand multi-feed fetch |
| `GET /api/stories` | Published stories by default; admin filters with token |
| `POST /api/stories` | Create a draft story (admin token) |
| `POST /api/ingest/rss` | Ingest RSS into the durable feed inbox (admin/cron token) |

## Cloudflare deployment

The repository keeps two build paths intentionally:

- `npm run build` verifies the original Next.js application remains healthy.
- `npm run build:vinext` creates the Cloudflare Workers build.

GitHub CI runs tests, lint, both builds, and a Wrangler deployment dry-run. Cloudflare should not be promoted to `main` until a recovery-branch preview has completed the real RSS → Supabase → draft lifecycle without auto-publishing.

See [DEPLOY.md](./DEPLOY.md) for the exact one-time Git connection, environment variables, and production gate.

## Live Beta Feed (development only)

The direct RSS Live Beta section can still be enabled locally with:

```bash
NEXT_PUBLIC_SHOW_LIVE_BETA=true
```

The durable production desk should instead read persisted Supabase stories. Live feed items do not become public internal stories unless they pass through the editorial workflow and are deliberately published.

## Project structure

```text
src/data/stories.ts         # development mock stories
src/data/rssFeeds.ts        # feed configuration
src/lib/story-repository.ts # story data-access boundary
src/lib/ingest/rss.ts       # RSS normalization
src/lib/ingest/ingest-feeds.ts
data/live-stories.json      # local live cache only
vite.config.ts              # vinext + Cloudflare Vite integration
wrangler.jsonc              # Cloudflare Worker configuration
```

## Deployment policy

Cloudflare Workers is the preferred low-cost hosting path. The existing Vercel project may stay connected as a temporary fallback until Cloudflare passes the end-to-end preview and production smoke tests; no Vercel paid plan is required for the migration itself.
