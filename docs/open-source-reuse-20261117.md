# Fact Desk: reuse decisions

Keep custom code focused on editorial provenance, conservative evidence labels, taxonomy and the reader experience. These rules are not supplied by a generic feed reader.

| Area | Decision | Reason |
| --- | --- | --- |
| Feed parsing | Retain existing fast-xml-parser; do not write an XML parser or switch parser during this release | Current parser already delegates XML decoding and has strict timestamp/source regressions |
| Feed acquisition at larger scale | Evaluate Miniflux before adding custom queueing, conditional HTTP fetching, OPML, retry dashboards or feed administration | Apache-2.0, feed scheduler and API already implemented; requires a separate Go process/PostgreSQL deployment rather than a Vercel function |
| Reader/browser acceptance | Use Playwright for subsequent browser gates | Existing browser runner, mobile emulation, webServer lifecycle and CI reports avoid custom browser tooling |
| Editorial database API | Reuse PostgREST, Supabase JS and PostgreSQL | Real local HTTP lifecycle now exercised; no custom REST/database transport or simulated persistence |
| Monitoring | Existing GitHub Actions failure signals and /api/feed-health now; Uptime Kuma if a central monitor becomes necessary | Reuse HTTP/JSON monitoring instead of building an incident dashboard; self-hosting requires an always-on host |
| Scheduler | Existing GitHub Actions standard runner and pinned source | No new job service or paid always-on host needed for current 15 public feeds |

Primary references: https://github.com/miniflux/v2 ; https://miniflux.app/docs/api.html ; https://playwright.dev/docs/test-webserver ; https://playwright.dev/docs/ci ; https://github.com/louislam/uptime-kuma ; https://docs.postgrest.org/en/stable/references/auth.html .

Observed failure on November 17: scheduled publication rejected 47 reports because Energy had no reports. The old manifest relied on opportunistic energy stories from general science news. Added the publisher-provided Guardian energy RSS endpoint, preserving original publisher links and strict publication checks. Kept a bounded 56-report payload and exact old-manifest read compatibility during rollout. Native actual-feed execution produced 36 reports with nonempty coverage in all eight desks, including three Energy reports. This is executed manual ingestion, not proof of a new scheduled run.

Validation: 225 native unit/reader/security tests passed, including actual CLI/local-Git publication rejection tests and exact legacy-manifest rollout checks. Vercel-target Next build passed. Editorial HTTP/PostgreSQL lifecycle gate passed three cases in the preceding execution; exact transcript is retained in docs/editorial-http-gate-20261116.txt. No hosted database or production resource was used for that gate.
