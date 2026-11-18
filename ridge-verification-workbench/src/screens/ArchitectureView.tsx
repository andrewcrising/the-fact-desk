import { ArchitectureDiagram } from "../components/ArchitectureDiagram";

const boundaries = [
  "RIDGE does not replace the model, agent, or application layer.",
  "RIDGE does not replace observability, monitoring, tracing, or logging systems.",
  "RIDGE does not enforce safety, intervene, override, or arbitrate execution.",
  "RIDGE produces canonical artifacts, deterministic replay evidence, verification digests, session roots, and certification evidence."
];

export function ArchitectureView() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="space-y-6">
        <div className="panel rounded-3xl p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-ridge-cyan">Architecture position</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-50">RIDGE in the execution stack</h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-400">
            RIDGE is a deterministic AI execution and proof substrate. It sits below the model and application layers and above hardware/runtime execution, at the execution-resolution layer where execution semantics are finalized and recorded as authoritative, replayable outcomes.
          </p>
        </div>
        <ArchitectureDiagram />
      </section>

      <aside className="panel rounded-3xl p-6">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-ridge-cyan">Boundary clarity</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-50">What RIDGE does and does not do</h2>
        <ul className="mt-6 space-y-4">
          {boundaries.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-ridge-cyan" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
