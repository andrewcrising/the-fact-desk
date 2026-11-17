# Vercel reader: Playwright release gate

## Corrected scheduler receipt: independently verified

Genuine schedule run 44078279588 succeeded at source 552f4849216cd63c2775c8359da1240dbb5b2a42 and published data commit 8e29ad500f66318c2ea2bda9f82cc7b8af2e5560. Authenticated job 134021870722 logged discovery.json SHA256 d0681e1045e530e252908b3ecaeab7a8f2d4c3a37b3ae9b0604369ca0b89c261; independently fetched Git bytes match. Snapshot fetchedAt is 2026-11-17T11:55:20.958Z, 47 reports from 15 feeds. Category counts: Politics 7, Markets 7, Technology 7, World 11, Health 5, Courts 5, Energy 3, Culture 2. This closes the new-source scheduled receipt gate; the public envelope cannot independently certify itself.

## Reusable browser acceptance

Pinned @playwright/test 1.65.1 with lockfile. Twenty checks across desktop Chromium and Pixel 7 Chromium emulation: eight direct category routes with populated source-linked/unreviewed leads, active tab state, no page-level JavaScript errors and no document overflow; real category-control navigation and eight distinct leads; fresh eight-category scheduled health from the reviewed producer. Chromium mobile emulation is not a physical device or Safari pass.

Run npm ci, install the Playwright Chromium browser, then npm run test:e2e. FACT_DESK_E2E_BASE_URL optionally changes the target; default is the public Vercel evaluation alias. PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH optionally selects an existing compatible Chromium/Chrome binary. The tests only navigate/read the public site. Reports, screenshots and traces remain local and ignored by Git.

The GitHub workflow uses the preinstalled Chrome on the standard public ubuntu-24.04 runner, pinned checkout/setup-node actions, read-only repository permissions, ten-minute timeout and no cache or artifact uploads. It also runs lint, TypeScript and the native unit suite. No Vercel build, deployment or paid service is started by this workflow.

## Execution status

225 native tests, lint and TypeScript passed locally. The first local browser attempt did not validate the site: the managed workspace denied Chromium's process-singleton socket, while direct Node API requests could not resolve the external host. Playwright-managed browser download also returned an invalid archive. The alternate authorized execution environment is the GitHub public runner; CI result is pending until read back. Do not describe local environment failures as product regressions or claim browser acceptance until the suite actually passes.


## Authenticated CI result: PASS

GitHub Actions run 44079046720, job 134024541540, executed 20/20 desktop Chrome and Pixel 7 Chromium-emulation checks successfully in 24.5 seconds. The same job passed 225 native tests, ESLint and TypeScript. Tested PR head: 48e443991bd7fa425c13e97c7d93427d38f607a7. PR #40 merged into work/vercel-production-gates-20261116 at 2aae11028065f6429ad3fe6515ddd45e10b226e5. This supersedes the pending-CI status above; local socket/DNS failures are closed by successful GitHub execution.

Independent page-payload readback also confirmed all eight category pages consume exactly the corrected snapshot's 47 story IDs and identify their source as scheduled. No forged scheduler or editorial verification fields were introduced.

Production environment metadata exposes only NEXT_PUBLIC_SHOW_LIVE_BETA and reports zero hidden production variables. The evaluated production environment therefore has no inspected Supabase/admin/scheduler configuration. This is configuration metadata evidence, not approval to promote or a hosted database lifecycle pass. Production application remains the older release. Next gate: prepare and verify the intended public-reader production configuration and rollback before cutover. No Vercel deployment or production resource write was started by the browser gate.
