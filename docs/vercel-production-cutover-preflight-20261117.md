# Vercel production cutover: concrete preflight

The user authorized production cutover from a6a23d9c3f71fdf0e8db43f51f6e3631ecd348f5 only when existing safety and $10 total incremental cost gates pass. The $10 amount supersedes the earlier $1 limit for Fact Desk; it is not a fresh per-run allowance.

## Passed

- Authenticated full source checkout at the exact requested SHA. PR #36 head b2dab72b84e7e89d20e2f2f330043be0b315dceb is an ancestor. PR #37 review route and original review migration are byte-identical; additive identity invalidation correction retained. Main and existing draft PRs preserved.
- Reader application source matches the deployed and browser-tested 552f4849 release; a6a23d9 adds the verified Playwright gate and documentation/dev dependencies. Previous authenticated CI ran 225 native tests, lint, TypeScript and 20 desktop/mobile Chromium checks successfully.
- Clean npm ci and native Next production build passed with VERCEL_ENV=production and the proposed flags. No Cloudflare authentication, resource or build required.
- Explicit production configuration probe consumed 47 authentic scheduled reports. Even after injecting dummy inherited database/admin/cron credentials and enabling mock fallback, the isolated reader denied database access, admin/cron authorization and fabricated fallback; cron route returned 401. Public-reader mode uses the existing explicit FACT_DESK_PREVIEW_ISOLATED guard deliberately, which disables write capabilities. This is not editorial CMS activation.
- Rollback target dpl_UpHztX9XQQBV8zDNQDeQuTBopAAm remains READY at db7244c0f12c3173fbc10349e16234265ccd67ad. Current production alias points to that deployment. No disruptive live rollback rehearsal was performed. The connector supports project-scoped rollback to this exact deployment.

## Exact configuration proposal

Production-only FACT_DESK_PREVIEW_ISOLATED=true, FACT_DESK_SCHEDULED_DISCOVERY=true and ALLOW_MOCK_FALLBACK=false. Preserve NEXT_PUBLIC_SHOW_LIVE_BETA. Do not add Supabase/admin credentials or enable editorial writes. Existing production environment metadata exposes only NEXT_PUBLIC_SHOW_LIVE_BETA and zero hidden production variables. None of the proposed variables has been applied.

Build with npm ci --no-audit --no-fund, npm run build, Next.js framework and Node 24. Keep automatic Git deployments disabled. Capture the new exact deployment ID and READY/source metadata; route production only after the gates pass. Verify all eight public routes, snapshot health, denied write routes, source/publisher links and production alias readback; use the recorded prior deployment for rollback if acceptance fails.

## Unresolved cost gate

The billing charges API returns 404 costs_not_found. The team metadata connector omits plan/usage/budget details and no connected tool exposes project budget controls. Official Vercel documentation advertises project-only budgets with optional production pausing. Dashboard access requires a separate sign-in; the secure request returned declined. That choice is respected, and automatic authentication will not be retried unless the user requests it. No production environment change, build, deployment or alias reassignment was performed.

A short fixed Basic build is expected to cost cents (published rate $0.007/minute), but this estimate does not verify posted spend or enforce the user's total cap. Do not report the cost gate passed from pricing alone. Do not modify shared team limits that could affect Ops Vault.

Next: resume authorized Vercel dashboard authentication, verify current Fact Desk spend and a project-only $10 pausing budget (or a genuinely equivalent cost control), then apply the reviewed configuration and execute the exact-source cutover.

Primary cost-control references: https://vercel.com/pricing ; https://vercel.com/changelog/set-budgets-for-projects-and-products-in-spend-management .
