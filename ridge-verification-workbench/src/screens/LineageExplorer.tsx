import { mockLineage } from "../data/mockLineage";

export function LineageExplorer() {
  return (
    <div className="space-y-6">
      <section className="panel rounded-3xl p-6">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-ridge-cyan">Sample append-only lineage view</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Mock predecessor-linked artifact chain</h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-400">
          RIDGE lineage is designed as immutable, predecessor-linked artifact continuity. The chain displayed here is sample lineage data showing how canonical execution artifacts could contribute to session-root accumulation, later inclusion proof generation, and external audit receipt workflows.
        </p>
      </section>

      <section className="panel rounded-3xl p-6">
        <div className="space-y-5">
          {mockLineage.map((node, index) => (
            <div key={node.artifactId} className="relative grid min-w-0 gap-4 rounded-2xl border border-ridge-border/70 bg-ridge-panelSoft/60 p-5 md:grid-cols-[220px_1fr]">
              {index < mockLineage.length - 1 ? (
                <span className="absolute left-8 top-[4.5rem] hidden h-8 w-px bg-ridge-cyan/30 md:block" />
              ) : null}
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-ridge-cyan/40 bg-ridge-cyan/10 font-mono text-sm text-ridge-cyan">
                  {index + 1}
                </div>
                <h3 className="mt-4 font-semibold text-slate-100">{node.label}</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <LineageField label="Sample artifact ID" value={node.artifactId} />
                <LineageField label="Mock predecessor hash" value={node.predecessorHash} />
                <LineageField label="Sample session-root accumulation" value={node.sessionRoot} />
                <LineageField label="Mock verification digest" value={node.verificationDigest} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-ridge-cyan/25 bg-ridge-cyan/10 p-5">
        <h2 className="text-lg font-semibold text-ridge-cyan">Inclusion proof placeholder</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          A production backend could compute inclusion proofs over append-only lineage and expose proof material to an external verifier. v1 displays a mock proof boundary without implementing server-side cryptographic storage.
        </p>
      </section>
    </div>
  );
}

function LineageField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 break-all font-mono text-sm text-slate-200">{value}</p>
    </div>
  );
}
