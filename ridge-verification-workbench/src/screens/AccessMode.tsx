import { AccessBanner } from "../components/AccessBanner";

const accessModes = [
  {
    name: "Public demo mode",
    description: "Open, controlled demo with mock canonical artifacts and static diligence copy.",
    status: "available in v1"
  },
  {
    name: "Private diligence mode",
    description: "Invite-only buyer or technical reviewer workspace with protected mock or customer-provided datasets.",
    status: "future auth integration"
  },
  {
    name: "Paid access mode",
    description: "Gated access with checkout, seat limits, and access receipts for qualified reviewers.",
    status: "future payment gating"
  },
  {
    name: "Enterprise NDA mode",
    description: "Enterprise review room with NDA gating, artifact access controls, and export policies.",
    status: "future enterprise controls"
  }
];

export function AccessMode() {
  return (
    <div className="space-y-6">
      <section className="panel rounded-3xl p-6">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-ridge-cyan">Access preparation</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Demo and gated-access readiness</h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-400">
          This panel documents clean seams for turning the front-end prototype into a controlled demo site, private diligence room, paid-access app, or enterprise NDA experience later. No authentication or payment provider is active in v1.
        </p>
      </section>

      <AccessBanner />

      <section className="grid gap-4 md:grid-cols-2">
        {accessModes.map((mode) => (
          <article key={mode.name} className="panel rounded-2xl p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <h2 className="text-lg font-semibold text-slate-100">{mode.name}</h2>
              <span className="rounded-full border border-ridge-border bg-ridge-panelSoft px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                {mode.status}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">{mode.description}</p>
          </article>
        ))}
      </section>

      <section className="panel rounded-3xl p-6">
        <h2 className="text-xl font-semibold text-slate-50">Upgrade path TODOs</h2>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-400">
          <p>
            {/* TODO: Add Clerk, Supabase Auth, or Firebase Auth here when protected diligence workspaces are required. */}
            Authentication seam: wrap the app shell with a provider and protect private routes or workbench sessions.
          </p>
          <p>
            {/* TODO: Add Stripe Checkout and billing webhooks when paid access is approved for production use. */}
            Payment seam: gate access mode selection behind checkout state, entitlement checks, and audit-safe receipts.
          </p>
          <p>
            {/* TODO: Replace mock data imports with backend API clients when canonical artifact generation is service-backed. */}
            Backend seam: replace local mock data with API calls for artifacts, policy manifests, certificates, lineage proofs, and audit receipts.
          </p>
        </div>
      </section>
    </div>
  );
}
