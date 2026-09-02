import { useState } from "react";
import { CodePanel } from "../components/CodePanel";
import { StatusBadge } from "../components/StatusBadge";
import { mockExecutionEnvelope } from "../data/mockExecutions";
import { createVerificationDigest } from "../utils/digest";
import { formatDateTime } from "../utils/formatters";

export function ExecutionIntake() {
  const [artifactDigest, setArtifactDigest] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerateArtifact() {
    setIsGenerating(true);
    const digest = await createVerificationDigest({
      envelope: mockExecutionEnvelope,
      canonicalizationProfile: "canonical-execution-artifact:v1"
    });
    setArtifactDigest(digest);
    setIsGenerating(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="panel rounded-3xl p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-ridge-cyan">Declared execution envelope</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-50">Simulated execution intake</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
              The intake view shows a sample AI execution event entering RIDGE as evidence material. RIDGE records and canonicalizes execution semantics; it does not alter, block, schedule, or route the execution.
            </p>
          </div>
          <StatusBadge status={artifactDigest ? "canonicalized" : "pending"} label={artifactDigest ? "Demo artifact generated" : "Awaiting demo generation"} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Detail label="Execution ID" value={mockExecutionEnvelope.executionId} />
          <Detail label="Model / runtime profile" value={mockExecutionEnvelope.modelRuntimeProfile} />
          <Detail label="Policy manifest ID" value={mockExecutionEnvelope.policyManifestId} />
          <Detail label="Environment fingerprint" value={mockExecutionEnvelope.environmentFingerprint} />
          <Detail label="Input commitment" value={mockExecutionEnvelope.inputCommitment} />
          <Detail label="Output commitment" value={mockExecutionEnvelope.outputCommitment} />
          <Detail label="Received at" value={formatDateTime(mockExecutionEnvelope.receivedAt)} />
          <Detail label="Declared tolerance limits" value={Object.values(mockExecutionEnvelope.declaredToleranceLimits).join(" | ")} />
        </div>

        <button
          type="button"
          onClick={handleGenerateArtifact}
          className="mt-8 rounded-xl border border-ridge-cyan/50 bg-ridge-cyan/10 px-5 py-3 text-sm font-semibold text-ridge-cyan transition hover:bg-ridge-cyan/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate Demo Canonical Artifact"}
        </button>

        {artifactDigest ? (
          <div className="mt-6 rounded-2xl border border-ridge-mint/30 bg-ridge-mint/10 p-4">
            <p className="text-sm font-semibold text-ridge-mint">Local demo canonical artifact digest generated</p>
            <p className="mt-2 break-all font-mono text-sm text-slate-200">{artifactDigest}</p>
          </div>
        ) : null}
      </section>

      <CodePanel title="Incoming envelope payload" subtitle="local mock data only" value={mockExecutionEnvelope} />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-ridge-border/70 bg-ridge-panelSoft/60 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 break-all font-mono text-sm leading-6 text-slate-200">{value}</p>
    </div>
  );
}
