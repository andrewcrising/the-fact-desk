# Deploy The Fact Desk to Vercel

Repo: **https://github.com/andrewcrising/the-fact-desk**

## Mock demo (default)

Vercel env — all `false` or unset:

```
NEXT_PUBLIC_SHOW_LIVE_BETA=false
NEXT_PUBLIC_USE_MERGED_STORIES=false
NEXT_PUBLIC_USE_RSS_CACHE=false
```

## Enable live RSS on production

1. Vercel → Project → **Settings → Environment Variables**
2. Add:

```
NEXT_PUBLIC_SHOW_LIVE_BETA=true
```

3. **Redeploy**

The homepage keeps the mock briefing desk. A **Live Beta Feed** section at the bottom fetches NPR, BBC, and CISA RSS every ~15 minutes (server cache). Stories link to original sources.

Optional — hourly cron refresh (included in `vercel.json`):

```
CRON_SECRET=your-random-secret
```

Vercel Cron calls `/api/cron/revalidate-live` to refresh the RSS cache.

## Verify live data

- Homepage → scroll to **Live Beta Feed**
- `GET /api/live-preview` — JSON with `source: "live"` or `"cache"`
- `GET /api/test-rss` — single-feed proof

## Local development

```bash
npm run dev
# .env.local
NEXT_PUBLIC_SHOW_LIVE_BETA=true
```

Optional local cache file:

```bash
npm run ingest:rss
```

## Next: persistent storage

For production-scale ingestion, add **Supabase/Postgres** or **Vercel Blob** so cron writes stories to a database instead of only `unstable_cache`.
