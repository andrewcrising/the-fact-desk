<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Overview
The Fact Desk is a single Next.js 16 app (App Router, TypeScript, Tailwind CSS v4). No database, Docker, or external services are required. Mock data mode is the default — no `.env.local` needed.

### Commands
See `README.md` for the full list. Key commands:
- `npm run dev` — start dev server at http://localhost:3000
- `npm run build` — production build
- `npm run lint` — ESLint (note: 2 pre-existing `@next/next/no-html-link-for-pages` errors in `TopNav.tsx` and `HealthDeskPlaceholder.tsx`)
- `npm run ingest:rss` — fetch RSS feeds into `data/live-stories.json` (optional, for live beta mode)

### Caveats
- The project uses **Next.js 16.2.6** which may have breaking changes vs earlier versions. Read docs in `node_modules/next/dist/docs/` before modifying Next.js-specific code.
- No automated test suite exists in this repo — validation is manual (dev server + browser).
- To enable the Live Beta Feed section, set `NEXT_PUBLIC_SHOW_LIVE_BETA=true` in `.env.local` and restart the dev server.
