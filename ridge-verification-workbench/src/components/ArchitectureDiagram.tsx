const layers = [
  {
    name: "AI Applications / Agents",
    description: "Application intent, agent workflows, and buyer-facing products."
  },
  {
    name: "Agent Frameworks",
    description: "Planner, tool-use, orchestration, and application-layer state."
  },
  {
    name: "Observability / Monitoring",
    description: "Logs, metrics, traces, dashboards, and operational diagnostics."
  },
  {
    name: "Inference Runtime / Model Serving",
    description: "Model invocation, serving containers, and runtime execution context."
  },
  {
    name: "RIDGE Execution Evidence Layer",
    description: "Canonical artifacts, deterministic replay, session roots, verification digests, and certification evidence.",
    active: true
  },
  {
    name: "Hardware / Accelerator Runtime",
    description: "Accelerator behavior, numeric execution surfaces, and low-level runtime substrate."
  }
];

export function ArchitectureDiagram() {
  return (
    <div className="panel rounded-3xl p-5">
      <div className="space-y-3">
        {layers.map((layer) => (
          <div
            key={layer.name}
            className={`rounded-2xl border p-4 transition ${
              layer.active
                ? "border-ridge-cyan/60 bg-ridge-cyan/10 shadow-glow"
                : "border-ridge-border/70 bg-ridge-panelSoft/50"
            }`}
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h3 className={`font-semibold ${layer.active ? "text-ridge-cyan" : "text-slate-100"}`}>{layer.name}</h3>
              {layer.active ? (
                <span className="rounded-full border border-ridge-cyan/30 bg-ridge-cyan/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-ridge-cyan">
                  execution-resolution layer
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{layer.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
