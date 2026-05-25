# The Fact Desk

**News signals ranked by evidence, not outrage.**

Calm evidence-ranked news briefing (Next.js, TypeScript, Tailwind).

## Commands

```bash
npm install
npm run dev          # local server → http://localhost:3000
npm run build        # production build (Vercel uses this)
npm run ingest:rss   # fetch RSS → data/live-stories.json
```

## Mock demo (default)

No env vars required, or copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SHOW_LIVE_BETA=false
NEXT_PUBLIC_USE_MERGED_STORIES=false
NEXT_PUBLIC_USE_RSS_CACHE=false
```

Homepage and `/story/[slug]` pages use mock data from `src/data/stories.ts`.

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

The **mock desk stays unchanged**. Cached live stories appear in **Live Beta Feed** below mock sections. Live items link to external sources — no internal detail pages yet.

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
| `GET /api/live-preview?fresh=1` | On-demand multi-feed fetch (`source: "live fetch"`) |

## Deploy to Vercel

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
