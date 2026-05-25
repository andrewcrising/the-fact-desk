import { FlowStep } from "../components/FlowStep";
import { MetricCard } from "../components/MetricCard";

const lifecycle = [
  {
    title: "Execution Intake",
    description: "Capture a declared execution envelope without changing application or model behavior."
  },
  {
    title: "Canonical Artifact",
    description: "Normalize execution semantics into a canonical execution artifact."
  },
  {
    title: "Replay Verification",
    description: "Run deterministic replay and compare verification digest equivalence."
  },
  {
    title: "Session Root",
    description: "Accumulate evidence into a session root with append-only lineage."
  },
  {
    title: "Certification Artifact",
    description: "Package the digest, envelope, tolerance profile, and signature metadata."
  },
  {
    title: "External Verification",
    description: "Allow an external verifier to recompute and emit an audit receipt."
  }
];

export function Overview() {
  return (
    <div className="space-y-8">
      <section className="panel overflow-hidden rounded-3xl p-8">
        <div className="max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-ridge-cyan">RIDGE / VERA diligence demo</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
            RIDGE Verification Workbench
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            A web-based technical diligence prototype showing deterministic execution evidence for replayable, certifiable AI outcomes. RIDGE operates at the execution-resolution layer, producing canonical artifacts, verification digests, session roots, and certification evidence for downstream governance consumers.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Artifacts verified" value="184" detail="Canonical execution artifacts processed in the mock diligence session." tone="cyan" />
        <MetricCard label="Replay equivalence" value="99.98%" detail="Passing replay comparisons under the declared execution envelope." tone="mint" />
        <MetricCard label="Certification records" value="37" detail="Certification artifacts prepared for external verifier review." tone="cyan" />
        <MetricCard label="Session-root continuity" value="Intact" detail="Append-only lineage preserves predecessor-linked evidence continuity." tone="amber" />
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-ridge-cyan">Lifecycle</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-50">Execution evidence lifecycle</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            RIDGE records authoritative, replayable outcomes. It does not schedule, allocate, route, optimize, enforce safety, or intervene in execution.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lifecycle.map((step, index) => (
            <FlowStep key={step.title} index={index + 1} title={step.title} description={step.description} />
          ))}
        </div>
      </section>
    </div>
  );
}
