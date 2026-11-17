# Scheduled evaluation ingestion: activation readiness

## Executed correction

The actual ingestion CLI previously published before checking category coverage or feed failure. Native CLI tests with disposable local Git remotes reproduced both defects: missing Energy coverage and a complete feed outage each replaced the accepted remote snapshot before exiting with failure.

Publication now checks fresh content, all eight categories and the existing majority-feed threshold before moving the data ref. Rejected runs retain the accepted remote commit and content timestamp. Successful runs emit the published commit, SHA-256 of the exact committed discovery.json bytes, reviewed source commit and genuine producer metadata (or null for a manual run).

The GitHub workflow now requires an explicit immutable FACT_DESK_EVALUATION_SOURCE_SHA, checks out that exact commit and verifies HEAD. Installing just the workflow on the older default branch must not run that branch's older application implementation.

## Executed validation

- 224 native project tests passed, including the three actual CLI/local-Git scenarios and exact publication-receipt digest comparison.
- ESLint and Next type generation/TypeScript passed.
- Workflow YAML parsed successfully. Seven native Bash preflight cases passed, including empty, malformed, uppercase, oversized and shell-injection-like values.
- One actual manual ingestion fetched 51 current source reports across all eight categories from 14/14 healthy feeds. Its producer remained null. This is executed feed/parser/storage evidence, not a scheduled-run receipt.
- The existing ingestion/build-isolation gates remain closed by default. Scheduler envelopes still cannot assert independently verified execution.

## Activation remains blocked

- The default main branch does not contain evaluation-ingestion.yml.
- The fixed data/evaluation-live-feed branch is absent.
- Cloudflare's dashboard requires sign-in in the available browser; automatic-build exclusions cannot yet be authenticated.
- The connected GitHub tools do not expose repository-variable mutation or workflow dispatch; the native GitHub CLI is not signed in.
- No production ref, existing PR, activation variable, scheduler or remote data branch was changed.

## Concrete activation sequence after access and approval

1. Authenticate Cloudflare build controls and exclude the data branch from automatic builds before any data-ref write.
2. Publish the reviewed evaluation source to an isolated development ref only after its build-trigger gates pass.
3. Add only the reviewed evaluation-ingestion.yml workflow to the default branch through a separately approved workflow-only PR. Keep application source and production unchanged.
4. Set the reviewed source SHA and the existing ingestion/build-isolation variables only after independently checking their claims.
5. Dispatch the workflow, compare its authenticated run identity and log receipt with the exact stored snapshot bytes, then enable the isolated reader's scheduled-discovery flag.
6. Verify an actual subsequent schedule-triggered run and healthy feed readback. Manual ingestion is not evidence of unattended scheduling.

The existing $1 total external-spending cap remains in effect. These new implementation and test steps used the available local execution environment and started no paid compute or deployments.
