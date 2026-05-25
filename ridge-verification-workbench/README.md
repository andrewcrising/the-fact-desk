# RIDGE Verification Workbench

RIDGE Verification Workbench is a front-end-first technical diligence demo for RIDGE/VERA. It presents deterministic execution evidence for replayable, certifiable AI outcomes through a polished web interface suitable for a controlled public demo today and future gated-access or paid-access deployment.

## What the app demonstrates

- Declared execution envelope intake for a simulated AI execution event.
- Canonical execution artifact generation using local state and mock evidence.
- Deterministic replay comparison with passing and failing examples.
- Verification digest, session root, and certification artifact presentation.
- Append-only lineage with predecessor-linked artifacts.
- External verifier flow that recomputes evidence and emits an audit receipt.
- Access mode planning for public demo, private diligence, paid access, and enterprise NDA workflows.

RIDGE is positioned as a deterministic AI execution and proof substrate at the execution-resolution layer. It produces canonical execution artifacts, deterministic replay evidence, verification digests, session roots, certification artifacts, append-only lineage, and audit receipts that downstream governance consumers may use.

## What is mocked in v1

- Execution envelopes, policy manifests, artifacts, certificates, lineage records, verifier receipts, and digest comparisons are local mock data.
- The "Generate Canonical Artifact" action updates client-side state only.
- Certificate JSON export is client-side only.
- Signature metadata, inclusion proofs, external verifier calls, authentication, payment gating, and backend APIs are placeholders.

## How to run locally

```bash
npm install
npm run dev
```

Build and preview a production bundle:

```bash
npm run build
npm run preview
```

## Deployment

This Vite app can be deployed to Vercel, Netlify, or Cloudflare Pages after connecting the GitHub repo.

Typical settings:

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

No backend or environment variables are required for v1.

## Future backend features

- Auth providers such as Clerk, Supabase Auth, or Firebase Auth for private diligence rooms.
- Stripe Checkout and entitlement checks for paid access mode.
- Backend APIs for canonical artifact generation, policy manifest retrieval, deterministic replay jobs, certificate issuance, external verifier receipts, and lineage proof generation.
- Durable append-only storage for predecessor-linked artifacts and session-root continuity.
- Signature service integration for production certification artifacts.

## What RIDGE is not

RIDGE is not a generic AI governance platform, observability tool, logging tool, safety enforcement system, scheduler, allocation engine, optimization engine, model, agent, or application layer.

RIDGE produces deterministic execution evidence. Downstream governance, audit, compliance, or safety systems may consume RIDGE-certified artifacts, but RIDGE itself provides proof, replay, certification, lineage, and external verification.

## Boundaries

This workbench intentionally excludes DIAL timing, interval, scheduling, allocation, turnover, fairness, routing, and optimization logic.

It also excludes DSEA enforcement, intervention, override, kill-switch, and safety arbitration logic.

The app avoids broad full-stack AI governance framing, speculative valuation claims, legal conclusions, and medical, trading, or consumer-app concepts.
