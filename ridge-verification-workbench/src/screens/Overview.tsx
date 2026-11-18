import { FlowStep } from "../components/FlowStep";
import { MetricCard } from "../components/MetricCard";


const demoShows = [
  "canonical execution artifact representation",
  "deterministic replay comparison",
  "verification digest and session-root continuity",
  "sample certification artifact generation",
  "append-only lineage visualization",
  "simulated external verification / audit receipt"
];

const demoDoesNotDo = [
  "does not perform live AI inference",
  "does not replace model-serving infrastructure",
  "does not replace observability or governance tools",
  "does not enforce safety policies",
  "does not schedule, allocate, or optimize workloads",
  "does not include production authentication or payments"
];

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
            RIDGE Verification Workbench is a front-end technical diligence demo showing how deterministic AI execution evidence can be represented, replayed, certified, linked through session-root lineage, and externally verified.
          </p>
          <div className="mt-6 rounded-2xl border border-ridge-amber/30 bg-ridge-amber/10 p-4 text-sm leading-6 text-ridge-amber">
            <strong className="font-semibold">Demo prototype:</strong> This prototype uses mocked sample artifacts and simulated verifier outcomes. It does not perform live runtime integration, production replay, authentication, or payment gating.
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="What this demo shows" items={demoShows} />
        <InfoCard title="What this demo does not do" items={demoDoesNotDo} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Sample artifacts displayed" value="184 demo" detail="Mock canonical execution artifacts shown for the diligence prototype." tone="cyan" />
        <MetricCard label="Demo replay equivalence" value="99.98%" detail="Sample replay comparisons under the declared execution envelope." tone="mint" />
        <MetricCard label="Mock certification records" value="37 sample" detail="Demo certification artifacts prepared for external verifier review." tone="cyan" />
        <MetricCard label="Sample session-root continuity" value="Intact" detail="Mock append-only lineage preserving predecessor-linked evidence continuity." tone="amber" />
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


function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="panel rounded-2xl p-5">
      <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ridge-cyan" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
