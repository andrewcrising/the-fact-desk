# Fact Desk: three executed advancement runs — November 17, 2026

{
  "run1": {
    "id": 44094089637,
    "head": "09d6c5736b0e6aa21521809ff4bf4155ca08c77f",
    "result": "20 existing browser cases passed; four axe scans reproduced contrast and keyboard-focus violations"
  },
  "run2": {
    "id": 44094710613,
    "head": "e0a1ad13147cf5b5904f28e8b530cecd52e9a530",
    "result": "24 browser cases, 225 native tests, lint and TypeScript passed; four axe scans clear"
  },
  "run3": {
    "id": 44095037970,
    "head": "5806705dfdfb60636986cb4eec97c9939ebc20e3",
    "result": "30 browser cases, 225 native tests, lint and TypeScript passed; eight category article routes in both viewports, keyboard scrolling and loopback HTTP write-denial probes"
  },
  "mergedPR": 41,
  "mergeSha": "1758ff37875837b041d37ec3cc6aac245c18d819",
  "productionDeployed": false,
  "budgetVerified": false,
  "negativeFinding": "Empty article synopsis sections did not reproduce; no content fallback introduced",
  "coverageLimit": "Desktop Chrome and Pixel 7 Chromium emulation; no Safari or physical-device certification"
}

Run 1 scanned the actual public Vercel evaluation. Run 2 and Run 3 executed an actual Next production build on an isolated loopback server using Playwright webServer, so candidate fixes were tested without a Vercel deployment. Accessibility checks use pinned @axe-core/playwright 4.14.0; no disabled rules or baseline exclusions. Mutated endpoints are probed only when FACT_DESK_E2E_LOCAL=true and the base host is 127.0.0.1; dummy inherited credentials remain confined to that test server. Browser failures from restricted local execution were not counted as product evidence.

The runtime changes are narrowly scoped: darken --muted-light from #8b93a3 to #667085 and add named-region keyboard focus to DeskTicker and HealthDeskTicker. The article content logic remains unchanged after its suspected empty-section problem did not reproduce. All nine candidate source/configuration files were authenticated byte-for-byte through GitHub readback before release-branch merge.

Production cutover is still blocked: a fresh Vercel billing page continued to display login after the reported sign-in. No project-only $10 budget was verified or changed, no Vercel deployment was started and no production environment was modified. Earlier a6a23d9c preflight and rollback remain recorded separately; this merge is a tested descendant that adds reader fixes. Preserve PR #36/#37 and shared cost limits. Do not automatically repeat authentication requests or the completed three runs.
