# Fact Desk — verified Vercel evaluation demo

Verified November 13, 2026. This report supersedes the earlier deployment-readiness status and the deployment-status statements in live-demo-release-20261113.md; that file retains the earlier engineering evidence.

Public URL: https://the-fact-desk-evaluation-20261113.vercel.app/

## Exact source and deployment

- Existing account/team: Andrew Rising’s projects, `team_R8yivBcJgG2l0OvKFqGiBG4g`.
- Existing project: `the-fact-desk`, `prj_65sAGzBT5NGr0qFr1djn41EJn1VJ`.
- Local branch: `work/live-demo-20261113`.
- Deployed source: `e31f7cf6a6ba15d33cd91ad49df32f7c5845d082`.
- Preceding native integration commits: `de319681eaccc55fa84ce360442a25e7d1bb7293`, `7358b36b61922b36b69def4f892b9bd42d27598f`, `6b656aa58d03cc33c7900e3f766ad17f9eb92d6c`.
- READY Preview: `dpl_6cC57KYJAny3xmhKWXeXwkjezCJe`; target is Preview, not production.
- Direct tracked-file upload: 211 exact Git files, payload SHA-256 `acaf492290fcf00cd4226747e35e48a4b3e4a8f4f943455c692dddf9f9c52a6a`.
- Remote branch/PR/CI not updated: direct upload avoids unknown Cloudflare Git-triggered builds. PR #36/#37 ownership preserved.
- Cloudflare code, Wrangler updates and provenance safeguards retained.

## External and native verification

Unauthenticated HTTP requests returned 200 for the homepage and each category. Browser clicks selected all eight actual category controls and loaded their corresponding URL and content. Homepage showed a current, populated Fox News lead with a separately linked PBS report about the same leadership challenge. Both original publisher URLs returned HTTP 200. Related reports remain explicitly unreviewed and do not establish independent verification.

| Category | HTTP | Visible reports | Browser control and populated lead |
| --- | --- | ---: | --- |
| Politics | 200 | 9 | PASS |
| Markets | 200 | 4 | PASS |
| Technology | 200 | 4 | PASS |
| World | 200 | 9 | PASS |
| Health | 200 | 4 | PASS |
| Courts | 200 | 7 | PASS |
| Energy | 200 | 4 | PASS |
| Culture | 200 | 5 | PASS |

Counts are one live snapshot, not guarantees of future coverage. Forty-six source reports were visible overall. Live QA caught a James Bond film headline matching financial “bond”; corrected the native classifier and deployed again. Final browser verification confirms the film appears in Culture and is absent from Markets.

- 146 native unit tests passed; TypeScript and ESLint passed.
- Final-source `VERCEL_ENV=preview npm run build` passed locally. Vercel independently ran npm ci, Next.js compilation and TypeScript successfully.
- Vinext build, Wrangler dry-run and preview isolation checks passed on the preceding source; the final change was a classifier phrase plus its unit regression.
- Native disposable PostgreSQL 18.6 migration replay, privilege, ABA, rollback and two-session provenance concurrency tests passed earlier in this run (details in live-demo-release-20261113.md).
- Supabase/PostgREST HTTP lifecycle integration remains unexecuted without disposable credentials; native SQL success is not an HTTP lifecycle pass.
- Public `/api/cron/revalidate-live` returned 401 without credentials. `/api/stories` returned 200 and an empty editorial database view; public RSS reader content is provided separately. No fake editorial records were added.
- Preview guards deny privileged Supabase access and admin/cron writes, including cached clients. Preview has no credential/database environment entries in the inspected environment metadata.
- Error/fatal runtime-log queries returned no matches in the checked deployment/time window. This is not a long-duration reliability claim.

## Access, cost and rollback

The user authorized up to $5 on the existing account. No new account, project, subscription, database or plan upgrade was created. Two short Basic 2-core builds were used; exact billed charges remain unavailable because the account billing endpoint returns costs_not_found. No claim of zero cost or exact remaining budget is made. No further chargeable work is scheduled by this release.

The evaluation-only alias has an alias-specific protection override so public news is accessible without Vercel sign-in. Project-wide deployment protection was not disabled. Final alias readback points to `dpl_6cC57KYJAny3xmhKWXeXwkjezCJe` under the existing project.

Production alias `the-fact-desk.vercel.app` still points to `dpl_UpHztX9XQQBV8zDNQDeQuTBopAAm`. No production database or Cloudflare bindings were modified. Previous READY evaluation build `dpl_5v84HnC1TFMZMomrBYqVYEWvgnfx` remains available: reassign only the evaluation alias to it for rollback. Alias reassignment and destination readback were exercised during this release; no production rollback was performed.

## Remaining production work, ranked

1. Durable scheduled ingestion and shared bounded cache; refresh currently depends on requests/active readers and per-isolate memory. Unit tests cover freshness, stale rejection, outages and refresh races; unattended scheduling is not verified.
2. Finish disposable Supabase/PostgREST lifecycle and authorization integration before enabling editorial writes; current demo intentionally reads public feeds without production credentials.
3. Preserve these local commits remotely after verifying Cloudflare automatic build cost/control; then enforce integrated native checks in CI and reconcile existing development PRs.
4. Feed health monitoring, distributed rate limiting, taxonomy refinements, mobile/accessibility QA and measured cold-start performance.
5. Confirm posted Vercel usage against the $5 cap before further chargeable work.
