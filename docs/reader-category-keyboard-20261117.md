# Reader category keyboard release gate — 2026-11-17

Base release: 157beef9f95fd5099dd0dd1f0f68867621b4bc5a. PR #42 targets work/vercel-production-gates-20261116; no default-branch or production mutation.

## Executed runs

| Run | Source | Outcome |
| --- | --- | --- |
| 44111287584 / job 134137260561 | f638c9f0d9d87d350f9af24ea0bbf8b48b400e88 | 30 existing browser checks passed; both new desktop/mobile arrow-navigation checks failed at focus assertion. Lint, TypeScript, 225 unit tests passed. |
| 44111840159 / job 134139244539 | 431ff7757bc41323b32b389258fcf7be56fdb901 | Fixed keyboard controls: 32 browser checks passed; lint, TypeScript, 225 unit tests passed. |
| 44112094147 / job 134140146976 | 3005d87af254154ba412c6d624eb813194d4fd7a | Expanded 34 browser checks passed, including browser back/forward and invalid-category fallback; lint, TypeScript and 225 unit tests passed. |

## Release decision

PR #42 merged at 24fdea4c458a090214198f0cf7398a5548ced10f. Its complete tree equals tested head 3005d87af254154ba412c6d624eb813194d4fd7a. Both changed file blob hashes were independently matched against a fresh Git fetch. Tests execute a genuine Next production build with desktop Chrome and Pixel 7 Chromium emulation; this is not physical-device coverage.

No Vercel deployment or production settings/alias changes occurred. Production alias readback remains READY dpl_UpHztX9XQQBV8zDNQDeQuTBopAAm, source db7244c0f12c3173fbc10349e16234265ccd67ad. Evaluation feed-health readback contained 44 reports and all eight populated categories; NASA feed failed and Guardian Law was empty, so status was correctly degraded. Observed scheduled producer run 44108231191, source 552f4849216cd63c2775c8359da1240dbb5b2a42, fetchedAt 2026-11-17T14:54:40.635Z. Runtime does not claim independent scheduler signature verification.

The current conversation browser has no old tab 4. A replacement billing tab 1 visibly shows Vercel login. The signed-in dashboard, posted spending and project-only $10 total limit remain unverified; do not deploy or change shared Ops Vault budgets. Next step is the user's explicitly requested manual sign-in handoff, then verify that gate and execute the guarded cutover from this descendant of 157beef9. Existing rollback/public-reader preflight remains in ops/vercel-production-cutover-20261117 at 385420c334d96c92d053933b2bc50eeef0117d1a.
