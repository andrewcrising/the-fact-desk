# The Fact Desk

**News signals ranked by evidence, not outrage.**

Calm evidence-ranked news briefing (Next.js, TypeScript, Tailwind).

## Commands

```bash
npm install
npm run dev          # local server → http://localhost:3000
npm run build        # production build (Vercel uses this)
npm run test         # focused MVP backend utility tests
npm run ingest:rss   # fetch RSS → data/live-stories.json
```

## MVP backend

The app now supports a Supabase/Postgres-backed editorial lifecycle:

`raw RSS/feed item → editorial inbox candidate → draft story → published story → archived/corrected story`

See [docs/MVP_BACKEND.md](./docs/MVP_BACKEND.md) for schema setup, required env vars, API routes, admin workflow, and Vercel notes.

Required production env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_API_TOKEN=
CRON_SECRET=
```

## Mock demo (default)

No env vars required, or copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SHOW_LIVE_BETA=false
NEXT_PUBLIC_USE_MERGED_STORIES=false
NEXT_PUBLIC_USE_RSS_CACHE=false
```

Homepage and `/story/[slug]` pages use published stories from Supabase when configured. If Supabase is missing or unavailable, they safely fall back to mock data from `src/data/stories.ts`.

## Live Beta Feed (local / preview)

1. Ingest RSS into the local cache:

```bash
npm run ingest:rss
```

2. Enable the Live Beta section:

```bash
# .env.local
NEXT_PUBLIC_SHOW_LIVE_BETA=true
```

3. Restart `npm run dev`.

The published desk stays unchanged. Cached live stories appear in **Live Beta Feed** below published sections. Live items link to external sources and do not become public internal stories unless promoted through the editorial workflow and published.

Optional: keep mock-only main feed (recommended):

```bash
NEXT_PUBLIC_USE_MERGED_STORIES=false
```

To merge live stories into the main homepage feed (dev only):

```bash
NEXT_PUBLIC_USE_MERGED_STORIES=true
```

## API routes

| Route | Purpose |
|-------|---------|
| `GET /api/test-rss` | Live fetch proof (single NPR feed) |
| `GET /api/live-preview` | Cached live stories (`source: "cache"`) |
| `GET /api/live-preview?fresh=1` | Protected on-demand multi-feed fetch (`source: "live fetch"`) |
| `GET /api/stories` | Published stories by default; admin filters with token |
| `POST /api/stories` | Create draft story (admin token) |
| `POST /api/ingest/rss` | Ingest RSS into durable feed inbox (admin/cron token) |

## Deploy to Vercel

**Quick guide:** see [DEPLOY.md](./DEPLOY.md) for step-by-step GitHub + Vercel instructions.

Summary:

### Mock-only public demo

1. Import repo → Next.js defaults.
2. Env: leave all flags unset or `false`.
3. Deploy.

### Beta with Live Beta Feed

1. Run `npm run ingest:rss` locally and **commit** `data/live-stories.json`, **or** run ingest in CI before build.
2. Set `NEXT_PUBLIC_SHOW_LIVE_BETA=true` on Vercel.
3. Redeploy.

**Important:** Vercel serverless filesystem is **not persistent**. Do not rely on writing `data/live-stories.json` at runtime in production. For production RSS, use **Vercel Cron** → ingest job → **Supabase/Postgres**, **KV**, or **Blob** → `story-repository.ts` reads persisted stories.

## Future: Health Desk (not built)

A dedicated Health Desk will separate mainstream medical guidance, lifestyle medicine, functional/integrative medicine, supplement evidence, and goal-based health options. Evidence sources: NIH ODS, NCCIH, ACLM, ACSM, major clinical guidelines.

## Project structure

```
src/data/stories.ts         # Mock stories (demo default)
src/data/rssFeeds.ts        # Feed configuration
src/lib/story-repository.ts # Data access boundary
src/lib/ingest/rss.ts       # RSS normalizer
src/lib/ingest/ingest-feeds.ts
data/live-stories.json      # Local live cache (npm run ingest:rss)
```
