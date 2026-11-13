# Fact Desk live demo verification — November 13, 2026

## Result and source boundaries

The existing evaluation reader is publicly accessible:
https://sentinel-factdesk-evaluation-feed-20261110-the-fact-desk.andrewcrising.workers.dev/

This run verified its live content, homepage lead, eight category controls and category-specific views in the browser. The homepage and all eight category HTTP requests returned 200. Three original-publisher URLs (BBC, Federal Reserve and Guardian) also returned 200. The displayed fetch time advanced from 12:28 to 12:35 UTC on separate requests; no unattended cron execution is attested.

**The local improvements below have not been pushed or deployed.** This existing URL is a Worker version alias; it is not evidence of isolated Worker Previews. The authenticated older check for 3ac42eb7ace0c4fe7dcc2320ed87dcf727c724f5 names a production Worker build, version 33af8385-6120-4630-beb3-cc1f784f3498. The precise version currently behind the mutable alias could not be authenticated.

## Repository integrity and ownership

Complete Git clone, `git fsck --full`, clean original lockfile installation and remote-ref readback succeeded.

- Local development branch: `work/live-demo-20261113`.
- Base/evaluation head: `3e5116553457d1b7f26f0e2a8f589cd75a5c2f12`.
- PR #36 head: `b2dab72b84e7e89d20e2f2f330043be0b315dceb` (already an ancestor of the evaluation branch).
- PR #37 head: `630ba0febb70c0aec13df9c6dc8ffc9d4ee8c970`.
- Neither PR nor automation was modified. No remote branch, merge or deployment was written.
- Original package-lock Git blob: `b6b595d8f261c6e3b5924edb50fcd6f9081b0929`.
- New Wrangler dependency/lock/install: `4.161.0` (minimum requested: 4.135.0). Regenerated through npm; final clean installation succeeded.

## Completed native changes

1. Extracted bounded discovery into native modules with single-flight refresh, five-minute TTL, 30-minute maximum fallback, outage retry backoff and unchanged fetch timestamps on failures.
2. Added legitimate BBC Technology/Business and Guardian Law feeds; kept the existing Cloudflare code and editorial/provenance layers.
3. Rejected impossible-calendar, missing/unknown-timezone, stale, future and unsafe-link items from live discovery before applying its item limit. Undated editorial inbox items remain available for review; their dates are not fabricated.
4. Added fallback lead selection, Lead story versus eligible Top Signal labeling, per-article cross-section deduplication and a visible-reader refresh every five minutes.
5. Kept representative headlines/excerpts aligned with their first citation; prevented same-publisher institutional boilerplate from merging unrelated releases.
6. Removed invented Editorial desk source attribution for stories with no attached source rows. Restricted independent-reporting wording to reviewed origins.
7. Added preview runtime guards against inherited privileged Supabase clients, admin/cron writes and mock fallback. Added source/build/lock isolation checks. Production bindings were not changed.
8. Corrected three obsolete/mismatched unit fixtures without relaxing the stricter provenance policy. Fixed generated-bundle ESLint scope and canonical Next route type generation.
9. Integrated the existing additive identity-invalidation SQL and regression into the actual checkout. Reproduced its original failure and verified the correction on native PostgreSQL.

## Executed validation

| Check | Result |
| --- | --- |
| Final `npm ci --no-audit --no-fund` | PASS |
| `npm test` | 142 tests passed, zero failures |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS; Next typegen followed by TypeScript |
| `npm run build:vinext` | PASS |
| Wrangler deploy dry-run against generated config | PASS; ASSETS binding only |
| `npm run build` | PASS |
| `npm run check:preview` | PASS local configuration; explicitly does not attest remote isolation/cost |
| `npm run test:postgres` | PASS native PostgreSQL 18.6 |
| Supabase HTTP lifecycle integration | SKIPPED: no disposable PostgREST test URL/service-role key |
| Updated-source browser smoke | NOT COMPLETED: managed preview launcher incompatible with Next flags; Vinext local dev then failed on restricted network-interface enumeration |
| Remote CI for local changes | NOT RUN; changes not pushed |

The disposable PostgreSQL runner replays schema/security/concurrency/review migration twice; executes the existing rollback regression; reproduces the old publisher-reassignment defect; applies and replays the existing additive correction; tests publisher/story reassignment, no-op and ABA behavior; verifies direct anon/authenticated SQL privilege denials; and executes both source-edit/review lock orderings using independent service-role sessions, plus transaction rollback. It never accepts a remote database URL.

A separate live ingestion execution returned 45 current stories across all eight categories: Politics 9, World 9, Energy 4, Technology 4, Health 7, Markets 5, Courts 6, Culture 1. Two of fourteen upstream feeds failed during that run; other sources remained available. No genuine multi-publisher cluster was observed in that sample; none was promoted to independently verified coverage.

## Existing deployed reader matrix

Counts are the category controls observed in the live browser, not the locally changed code. Each view had a populated, externally linked lead.

| Category | HTTP | Visible report count | Browser selection/lead |
| --- | --- | ---: | --- |
| Politics | 200 | 8 | PASS |
| Markets | 200 | 3 | PASS |
| Technology | 200 | 1 | PASS |
| World | 200 | 9 | PASS |
| Health | 200 | 7 | PASS |
| Courts | 200 | 2 | PASS |
| Energy | 200 | 4 | PASS |
| Culture | 200 | 5 | PASS |

The existing deployment still repeats the lead in lower sections, includes a false Federal Reserve grouping, and has narrow Technology coverage. These are corrected or expanded locally, not on the existing public URL.

## Cost, isolation and rollback gates

No paid resource, remote CI run, push, merge or deployment was initiated. Vercel Git deployment is disabled in repository configuration. Account-specific Vercel billing lookup returned 404 `costs_not_found`; that is not proof of zero future costs. Both the Cloudflare dashboard and Wrangler require authentication, so account plan/usage, Worker Preview secrets/base config, production branch controls and remote rollback could not be inspected.

The local generated Worker config has only ASSETS and no configured database, queue or service resource bindings. Runtime tests reject cached privileged clients and admin/cron tokens in isolated mode. This does not prove what an existing remote Worker inherits.

Local rollback is the exact base commit above. Keep the original branch and do not reset concurrent remote work. Remote promotion/rollback must be verified under the authenticated Cloudflare account before publication.

## Highest-impact remaining work

1. Authenticate Cloudflare, verify account-specific cost plus true Preview isolation/rollback, push the tested branch only once automatic build behavior is known, then deploy and smoke-test the changed source.
2. Run disposable Supabase/PostgREST lifecycle integration; do not enable production provenance writes based on native SQL tests alone.
3. Add durable scheduled ingestion/cache and feed-health operations. Current refresh is request-driven and active-reader-driven; no unattended scheduler success is claimed.
4. Measure changed-source Worker CPU/cold-load performance and complete mobile/accessibility browser QA before production release.

## Follow-up: actual homepage refresh cache — November 13, 2026

Confirmed the delivered evaluation tab's document title and news content are The Fact Desk. MeritLayer was not modified.

The old authenticated refresh route invalidated a legacy Next cache tag while the homepage used the new discovery cache. Replaced that disconnected operation with invalidation and refresh of the actual homepage cache. Added a generation fence so an earlier in-flight fetch cannot overwrite a newer refresh or clear its pending request. The response distinguishes refreshed live data from failed refresh/fallback and states its current-Worker scope; no durable cross-isolate scheduling is claimed.

- Native unit suite: 144/144 passed, including invalidation/concurrency fencing and unauthorized/isolated-preview refresh denials.
- Actual authenticated route execution with public upstream feeds: HTTP 200, `refreshed=true`, 46 reports, and homepage cache readback of the same 46 reports at 2026-11-13T12:43:40.574Z.
- TypeScript, ESLint, Vinext build, generated preview isolation check, Wrangler dry-run and Next.js build: passed on the updated source.
- Still not remotely pushed or deployed. Cloudflare authentication, account cost, remote bindings and rollback remain release gates.
