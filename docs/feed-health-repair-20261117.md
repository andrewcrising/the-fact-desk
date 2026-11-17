# Feed repair release evidence — 2026-11-17

PR #43 merged at 66dd22d4454702390c9a15ab544447906cf4cb92; complete merge tree matched tested d63194bc1c7fe1eb55b8979274174e2b9cad6246. All eight changed/new file blob hashes matched a fresh Git fetch.

Native upstream diagnosis found NASA HTTP 200, 288,224 decoded bytes, SHA256 960c785185eb94f21a4bdbab52146b2e5a8ea5acc07ea40afd9ce8b5381e07e8, ten current/safe items. Its genuine body exceeded the ordinary 262,144-byte limit. Guardian Law HTTP 200 had twenty current/safe entries: six eligible /law/ URLs, zero among the first four. Fix: explicit 524,288-byte NASA-only allowance and eligibility before quota. Invalid allowance values and oversized bodies still fail. All other feeds retain 256 KiB; all feeds retain four-report quota and exact manifest/URLs; 56-report overall cap remains. Existing fast-xml-parser reused, no dependency added.

| Native run | Source | Result |
| --- | --- | --- |
| 44119238275 / 134165704568 | 4354b5619e3119003df148b92bf8acc4c8b9d53e | 225 original unit cases passed, two new reproductions failed; lint/typecheck passed and original upstream diagnostics captured. |
| 44119508724 / 134166674608 | 915420ddaa98a11f8a2bcd35a92868fd6d21171f | 227 unit tests, lint, typecheck, real live discovery and 34 browser checks passed. |
| 44119789003 / 134167669382 | d63194bc1c7fe1eb55b8979274174e2b9cad6246 | Expanded 228 unit tests including allowance hardening, lint/typecheck, real live discovery and 34 browser checks passed. |

Both corrected live-discovery gates yielded 54 reports, 15/15 healthy feeds, all eight categories populated, and four eligible NASA plus four Guardian Law reports. These CI probes were explicitly nonpublishing and never claimed scheduled provenance.

PR #44 changed exactly one default-branch source-pin line, merged at 1ddfe4c2535e09bb46ae1d05db10361611dcfeeb. Authenticated main readback confirms REVIEWED_SOURCE_SHA=66dd22d4454702390c9a15ab544447906cf4cb92. Existing schedule, content-write scope, fixed data ref, provenance and lease remain. Vercel automatic Git builds disabled.

Vercel deployment dpl_98M4MLPEe5tVqrbuftNBcJrRzU1H is READY, target production, exact source 66dd22d4454702390c9a15ab544447906cf4cb92, and alias the-fact-desk.vercel.app readback included. No database or editorial mutation. First corrected natural scheduled receipt remains to be observed; do not count CI's nonpublishing probe as that receipt.

User supplied a Vercel Hobby usage dashboard capture showing substantial allowance headroom (e.g. active CPU 4m10s/4h, CDN requests 2.2K/1M, invocations 993/1M), and authorized continued work within the existing $10 total. These are user-provided dashboard figures, not independently fetched invoices or an enforced project cap. No paid service/subscription added; no shared Ops Vault budget changes.
