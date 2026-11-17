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

## Independently verified scheduled execution

The first genuine schedule run 43997692366 succeeded and published 14d073e4b64f0d9cab68473ca94bfb3cf27b0dae, exact discovery.json SHA256 731f26ba3ca02c7045218c38c5503c2f7a26884dfb8a6a9d842b04ebdda968b2. Authenticated Actions logs and independently fetched Git bytes match.

The subsequent schedule run 43999146325 succeeded and published 21d101b5319f81213d3c4fcd42fece19e81ab2be, exact discovery.json SHA256 6685aff66e08694c79f6323691c7561ce5238119c74a895ace86d398d0c2e6d3. Source is b2dd33e829bc0cdacea6a690d4f233bb547386fd. Vercel health reported that same producer/run and 51 reports with 14/14 healthy feeds. Eight independently fetched public category pages matched all 51 snapshot IDs and fetchedAt 2026-11-17T01:55:30.050Z, and each visible lead matched its category's snapshot report. Exact results: docs/vercel-snapshot-reader-acceptance-20261116.json. A later genuine run 44002234002 was also observed healthy at 02:20:48.763Z UTC.

The public schedulerVerified field deliberately remains false: an untrusted envelope cannot self-certify. This external comparison of authenticated run identity, logged receipt, Git bytes and actual rendered page payload is the independent verification. Never fabricate event environment or upgrade editorial/source independence labels.

## Newly passed production-readiness gate

The previously unexecuted Supabase-client HTTP lifecycle now runs locally against disposable PostgreSQL 18.6 and genuine PostgREST 16.6. Official Linux x86-64 release archive SHA256 335ea29f00145705fb569b1268b9c8e53d062f8f6f9188192e92ea3781d2dca1 was verified against GitHub release asset metadata. No hosted database or production credential is used. A loopback adapter removes only /rest/v1; PostgREST performs actual JWT authentication, role switching, SQL access and serialization.

The old lifecycle fixture cast Request to NextRequest and failed on request.nextUrl. Creating an actual NextRequest repaired the fixture without changing production route behavior. Three native integration tests pass: editorial create/promote/publish/archive and public reader lifecycle; reviewer authorization/persistence, rejection of forged reviewer identity and stale URL, source-edit and ABA invalidation; newsletter/protected routes. Direct anonymous/authenticated access to stories and review rows is denied and a forged service-role JWT receives 401. App route handlers are invoked directly in these tests; database requests traverse real HTTP. This is not a browser end-to-end or hosted Supabase gateway test.

Reproduce with a verified PostgREST 16.6 executable: POSTGREST_BIN=/absolute/path/to/postgrest npm run test:editorial-http. Script binds only 127.0.0.1, creates temporary credentials/database, clears inherited app credentials from the test child and tears down native servers/storage. Native unit tests 224/224, ESLint and TypeScript also pass.

## Production and rollback

The production application remains READY at db7244c0f12c3173fbc10349e16234265ccd67ad, deployment dpl_UpHztX9XQQBV8zDNQDeQuTBopAAm. Main has automatic Git builds disabled. No production database, editor-write enablement or application promotion occurred.

Previous public evaluation deployment dpl_6X3Vb5rNGtLHpU4gWKQ2R3LvkDvG remains the exact alias rollback destination. Disable/remove the ingestion workflow to stop schedules; preview flag is separately scoped. Preserve the SQL/provenance safeguards and finish disposable Supabase/PostgREST HTTP lifecycle tests before enabling production editorial writes. Prior native SQL results do not substitute for that HTTP gate.

## Cost boundary

Existing $1 total external-spending cap remains. This turn used local execution, standard public GitHub runners and one Vercel preview rebuild (approximately 47 seconds). No paid database, new project, subscription or plan upgrade was created. The Vercel billing endpoint still returns 404 costs_not_found, so posted charges and exact remaining allowance are not verified. Do not claim zero Vercel charges.
