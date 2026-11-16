# Durable evaluation ingestion — November 13, 2026

## Completed and preserved

The existing public demo remains at https://the-fact-desk-evaluation-20261113.vercel.app/ on deployed source `e31f7cf6a6ba15d33cd91ad49df32f7c5845d082`. HTTP readback still returned a populated Fact Desk reader. No new deployment, production write, account, subscription, paid resource or branch update was initiated in this run.

Implementation commit on local branch `work/live-demo-20261113`: `82e04ba986f8a1f313d554058b9249fe58e226e8`.

The complete integrated source, including the previous live-reader improvements, was preserved through GitHub's Git object API at https://github.com/andrewcrising/the-fact-desk/commit/52d531d6361bd4ce8eec749853dac9b175d778a3 . Its tree `8da5383c5ce473e1596c427a6ef95d0059a71af2` exactly matches the locally tested implementation. A fresh Git fetch and zero-diff comparison independently confirmed that equality. This is an object-only checkpoint, not a remote development branch or PR. No ref was moved: GitHub reported zero Actions runs and zero statuses for it. Preserve a normal branch after build-trigger gates pass; unreferenced objects are not a long-term branch-retention guarantee.

## Native implementation

- Reused the actual 14-feed discovery registry and RSS parser, without adding editorial records or fabrication.
- Versioned, 512 KB maximum durable snapshot: at most 56 source reports and exactly the known 14 feed-health records. Sources and URLs must align to the known publisher domains. Invalid, future and stale timestamps are rejected.
- Snapshot parsing reconstructs bounded public fields and strips editorial confidence, Top Signal status, claimed independent origins and unknown fields. Stored discovery cannot authorize editorial publication.
- Per-feed eligible-content count, latest successful ingestion and consecutive empty/failure counters. Partial failures remain visible; a total outage preserves the last successful content timestamp. Content expires after 30 minutes even if failed attempts continue.
- Atomic file replacement with a cross-process lock, explicit failed-write preservation and restart recovery.
- Git-backed evaluation storage branch `data/evaluation-live-feed`, with explicit destination, monotonic attempt checks, exact compare-and-swap lease and server readback. Conflicting producers cannot silently overwrite each other. The data branch includes only discovery.json and a Vercel Git-deployment-disabled configuration.
- Activation-gated GitHub workflow, every 15 minutes, a fixed public repository, pinned actions, standard Ubuntu runner, five-minute timeout, serialized ingestion and no deployment or production-secret access. Empty feeds produce visible job warnings. No paid artifact/cache action was added.
- Opt-in Preview-only snapshot reads from one fixed GitHub HTTPS URL, no redirects, three-second deadline, streamed body-size bound, single-flight reads, outage backoff, rollback rejection and invalidation fencing. Independent readers retain the original ingestion timestamp; reads never rejuvenate content.
- Homepage uses valid stored content first and bounded live RSS fallback otherwise. Production cannot opt into this evaluation store. Stored content has an explicit stored-snapshot label.
- Read-only `/api/feed-health` reports per-feed and eight-category coverage, 503 for missing/stale snapshots, and never triggers RSS ingestion. It explicitly does not attest an unattended scheduler run.
- CLI refuses to publish without both explicit activation/build-isolation gates and refuses misleading provenance from a dirty source tree.

## Executed validation

| Check | Result |
| --- | --- |
| Native npm suite | 157 passed, zero failed/skipped |
| Actual local bare-Git publication/readback | PASS |
| Two independent producer-process race | PASS: one competing update accepted; stale lease rejected |
| Atomic file restart/outage/failed-write preservation | PASS |
| Malformed envelopes, invalid times, credential/private/incorrect publisher URLs, forged editorial provenance, streamed oversize body | PASS |
| Reader outage expiry, rollback and in-flight invalidation | PASS |
| Production isolation and closed CLI gates | PASS |
| ESLint, TypeScript | PASS |
| Next.js Preview build | PASS |
| Vinext/Cloudflare build | PASS |
| Generated preview configuration/binding/lock check | PASS local; no remote attestation |
| Lockfile | Unchanged from the previously clean-installed, deployed source |
| Workflow structure | Inspected: gated, standard runner, bounded duration, no deploy step |
| New remote CI/scheduled invocation | NOT RUN / NOT ACTIVATED |
| Supabase HTTP lifecycle / native SQL replay | Not rerun; no database changes in this follow-up |

Actual committed-source ingestion produced **48 current source reports**, persisted across a restarted ingestion process at `2026-11-13T16:03:09.867Z` (10:03 AM America/Chicago). Payload 74,981 bytes; sourceSha exactly `82e04ba986f8a1f313d554058b9249fe58e226e8`.

| Category | Persisted source reports |
| --- | ---: |
| Politics | 9 |
| Markets | 4 |
| Technology | 5 |
| World | 9 |
| Health | 4 |
| Courts | 8 |
| Energy | 4 |
| Culture | 5 |

Thirteen feeds supplied eligible content; NASA failed and its consecutive-failure counter advanced to two. An earlier live attempt returned only 32 reports and five failed feeds; failures were retained honestly, then successful feeds recovered. These are actual ingestion snapshots, not fixed guaranteed future coverage. The durable transport was exercised through native filesystem and local Git servers, not the still-inactive public storage branch.

## Cost and activation gates

The existing Vercel account/project was read back. Billing queries for November 13 and November 1–13 both returned HTTP 404 `costs_not_found`. The dashboard billing route shows a Vercel sign-in page. Neither response proves zero charges, posted usage or the remaining portion of the user's $5 cap. No further potentially chargeable Vercel build, scheduler or resource was started.

Vercel Git deployment is disabled in the source configuration. Cloudflare's account-specific nonproduction build controls and exclusion of the new code/data branches remain unverified; repository configuration alone cannot disable those provider-side hooks. Therefore no branch push or scheduled publication was performed. Git object creation preserves source without emitting a branch push event.

GitHub authenticated repository metadata confirms this is a public repository. Official GitHub documentation states standard hosted runners are free for public repositories: https://docs.github.com/en/billing/concepts/product-billing/github-actions . GitHub schedules require the workflow on the default branch and may be delayed or disabled after inactivity: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows . The workflow on this development tree is **implemented, not activated**.

Current Vercel Schedules beta also supports Preview environments and has usage billing; it is a valid future alternative, not a resource enabled here: https://vercel.com/changelog/vercel-schedules-is-now-in-public-beta . Do not rely on legacy cron configuration as evidence of a working Preview scheduler.

## Exact activation sequence

1. Authenticate the existing Vercel billing dashboard and reconcile posted evaluation charges against the $5 total cap. Do not infer headroom from an unavailable endpoint.
2. Authenticate Cloudflare Workers Builds settings; verify automatic builds exclude the selected development branch and `data/evaluation-live-feed`. Preserve production bindings, production branch and unrelated automations. Record the actual settings before any ref update.
3. Create a remote development branch at the preserved tested source and update an appropriate draft PR without overwriting PR #36/#37 ownership. Put only the reviewed, isolated scheduler workflow on the default branch through the normal review/release gates; do not merge the whole reader to production merely to enable a schedule.
4. After those gates pass, explicitly enable repository variables `FACT_DESK_EVALUATION_INGESTION_ENABLED=true` and `FACT_DESK_NONPRODUCTION_BUILDS_DISABLED=true`, then run the workflow once. Confirm the data branch contains current, attributable content and diagnostics. Repository variables are operator assertions, not substitutes for the independent checks above.
5. Set `FACT_DESK_SCHEDULED_DISCOVERY=true` only on an isolated evaluation Preview. Deploy within confirmed remaining budget and move only the evaluation alias after HTTP/browser checks. No database or production credential is required.
6. Verify two genuine scheduled invocations, independent cold readers, stable stored fetchedAt, all eight categories and `/api/feed-health`. Check runtime errors and posted usage. Native tests alone are not proof of platform scheduling.

Rollback: disable the ingestion repository variable and Preview opt-in; reassign only the evaluation alias to the previous READY deployment. Do not reset production or concurrent branches. Do not delete the source checkpoints or unrelated work.

## Remaining production gaps

Highest priority: resolve the billing/build-hook authentication gates, then activate and observe the scheduled path. After that: durable storage with an explicit retention policy (Git history grows even though each current snapshot is bounded), schedule-lag alerting and recovery, a true shared rate limiter, full Supabase HTTP lifecycle integration, and measured mobile/accessibility/performance checks. This Git-backed evaluation store is a low-cost isolated demo path, not a production datastore capacity claim.
