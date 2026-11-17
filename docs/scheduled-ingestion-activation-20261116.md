# Vercel-only evaluation ingestion: activation handoff

Verified November 16, 2026 (America/Chicago). Supersedes the previous Cloudflare-login activation blockers in this file. User selected Vercel and instructed that Cloudflare login be ignored. Vercel is the active evaluation and production hosting target; do not request Cloudflare credentials to advance this release.

## Executed release

- PR #38 merged after GitHub Actions run 43996325033 passed regression tests, ESLint and production build.
- Default branch merge: fb042b920a9d11130a657975362c85735ec5c16d.
- Only runtime-neutral changes on main: scheduled-ingestion workflow and deterministic test clock for an expired August clustering fixture. Main tests reproduced 15/16 before correction, then passed 16/16; local lint, TypeScript and build passed.
- The scheduler checks out reviewed ingestion implementation b2dd33e829bc0cdacea6a690d4f233bb547386fd, not the older main application. Its 224 native tests passed again, including real CLI/local-Git rejection and exact-digest publication regressions.
- Workflow has no repository-variable or Cloudflare dependency. It checks Vercel Git deployment suppression before the fixed evaluation-only data-branch push. Standard public ubuntu-latest runner, five-minute timeout, pinned actions, no scheduler artifact/cache uploads.
- Vercel preview-only branch variable FACT_DESK_SCHEDULED_DISCOVERY=true installed for work/category-correction-20261116. Production environment untouched.
- READY preview deployment dpl_E1FfHsgsG2tVe9puUca9F3XJHvHB, unchanged tested reader source 2fb1f2e2ad2646bfbe69cf01072958b9162d52bc.
- Public evaluation alias reassigned and read back: https://the-fact-desk-evaluation-20261113.vercel.app/ . Existing alias-specific public-access override retained; project-wide protection unchanged.
- Eight unauthenticated category pages returned HTTP 200 with eight distinct populated lead URLs, HTTPS publisher links and unreviewed labels. Energy lead is Jackdaw gas. Zero unsafe source href values in the rendered reader region; sidebar excluded.
- Existing draft PR #36 remains b2dab72b84e7e89d20e2f2f330043be0b315dceb; #37 remains 630ba0febb70c0aec13df9c6dc8ffc9d4ee8c970.

## Exact unresolved acceptance gate

At 19:37 CST the first genuine scheduled run had not yet appeared. Feed health returned 503/unavailable, zero stories, schedulerObserved=false and producer=null; this correctly does not claim scheduler success. Homepage/category readers remain populated through their existing live-feed path. A schedule installation is not proof of execution.

Next: inspect a genuine schedule-triggered run, compare authenticated logs/receipt/source SHA with exact data/evaluation-live-feed:discovery.json SHA256, then verify the Vercel /api/feed-health and all eight reader categories consume that snapshot. Never fabricate GITHUB_ACTIONS/event provenance. Reject failed/partial snapshots while preserving the last accepted data ref.

## Production and rollback

The production application remains READY at db7244c0f12c3173fbc10349e16234265ccd67ad, deployment dpl_UpHztX9XQQBV8zDNQDeQuTBopAAm. Main has automatic Git builds disabled. No production database, editor-write enablement or application promotion occurred.

Previous public evaluation deployment dpl_6X3Vb5rNGtLHpU4gWKQ2R3LvkDvG remains the exact alias rollback destination. Disable/remove the ingestion workflow to stop schedules; preview flag is separately scoped. Preserve the SQL/provenance safeguards and finish disposable Supabase/PostgREST HTTP lifecycle tests before enabling production editorial writes. Prior native SQL results do not substitute for that HTTP gate.

## Cost boundary

Existing $1 total external-spending cap remains. This turn used local execution, standard public GitHub runners and one Vercel preview rebuild (approximately 47 seconds). No paid database, new project, subscription or plan upgrade was created. The Vercel billing endpoint still returns 404 costs_not_found, so posted charges and exact remaining allowance are not verified. Do not claim zero Vercel charges.
