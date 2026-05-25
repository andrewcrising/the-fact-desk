import { useMemo, useState } from "react";
import { CodePanel } from "../components/CodePanel";
import { StatusBadge } from "../components/StatusBadge";
import { replayScenarios } from "../data/mockExecutions";

export function ReplayVerification() {
  const [scenarioId, setScenarioId] = useState<"passing" | "failing">("passing");
  const scenario = useMemo(() => replayScenarios.find((item) => item.id === scenarioId) ?? replayScenarios[0], [scenarioId]);
  const failed = scenario.id === "failing";

  return (
    <div className="space-y-6">
      <section className="panel rounded-3xl p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-ridge-cyan">Deterministic replay</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-50">Replay verification comparison</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
              RIDGE compares original and replay artifacts to verify replay equivalence. A discrepancy result emits evidence for downstream governance consumers; it does not change or block the underlying execution.
            </p>
          </div>
          <div className="flex rounded-xl border border-ridge-border bg-ridge-panelSoft p-1">
            {replayScenarios.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setScenarioId(item.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  scenarioId === item.id ? "bg-ridge-cyan/15 text-ridge-cyan" : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {item.id === "passing" ? "Passing example" : "Failing example"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Summary label="Digest comparison" value={scenario.originalDigest === scenario.replayDigest ? "Match" : "Mismatch"} failed={failed} />
        <Summary label="Equivalence result" value={scenario.equivalenceResult} failed={failed} />
        <Summary label="Tolerance check" value={scenario.toleranceCheck} failed={failed} />
      </section>

      <section className="panel overflow-hidden rounded-3xl">
        <div className="border-b border-ridge-border/70 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-50">Field-level comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-ridge-panelSoft/80 text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-3">Field</th>
                <th className="px-5 py-3">Original artifact</th>
                <th className="px-5 py-3">Replay artifact</th>
                <th className="px-5 py-3">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ridge-border/70">
              {scenario.fields.map((field) => (
                <tr key={field.field}>
                  <td className="px-5 py-4 font-medium text-slate-100">{field.field}</td>
                  <td className="px-5 py-4 font-mono text-slate-400">{field.original}</td>
                  <td className="px-5 py-4 font-mono text-slate-400">{field.replay}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={field.result === "mismatch" ? "discrepancy" : "verified"} label={field.result} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {scenario.discrepancyReport ? (
        <section className="rounded-3xl border border-ridge-red/30 bg-ridge-red/10 p-5">
          <h2 className="text-lg font-semibold text-ridge-red">Discrepancy report</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            {scenario.discrepancyReport.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-ridge-red" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <CodePanel title="Replay comparison object" subtitle={scenario.label} value={scenario} />
    </div>
  );
}

function Summary({ label, value, failed }: { label: string; value: string; failed: boolean }) {
  return (
    <div className="panel rounded-2xl p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`mt-3 text-xl font-semibold ${failed ? "text-ridge-red" : "text-ridge-mint"}`}>{value}</p>
    </div>
  );
}
