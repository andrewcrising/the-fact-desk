import { ArtifactCard } from "../components/ArtifactCard";
import { CodePanel } from "../components/CodePanel";
import { StatusBadge } from "../components/StatusBadge";
import { canonicalArtifact } from "../data/mockArtifacts";
import { formatDateTime } from "../utils/formatters";

export function ArtifactViewer() {
  return (
    <div className="space-y-6">
      <section className="panel rounded-3xl p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-ridge-cyan">Canonical execution artifact</p>
            <h1 className="mt-3 break-all text-3xl font-semibold text-slate-50">{canonicalArtifact.artifactId}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
              This demo canonical execution artifact packages a declared envelope, runtime metadata, numeric normalization profile, predecessor artifact hash, and verification digest as sample evidence for review.
            </p>
          </div>
          <StatusBadge status="canonicalized" label="Sample canonicalized artifact" />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <ArtifactCard
            label="Verification digest"
            title="Digest-bound canonical artifact"
            digest={canonicalArtifact.verificationDigest}
            detail="Sample digest shown from normalized mock execution evidence and policy manifest references."
            status="canonicalized"
          />
          <div className="panel rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Timestamp</p>
            <p className="mt-3 text-lg font-semibold text-slate-100">{formatDateTime(canonicalArtifact.timestamp)}</p>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Predecessor artifact hash: <span className="break-all font-mono text-ridge-cyan">{canonicalArtifact.predecessorArtifactHash}</span>
            </p>
          </div>
        </div>
        <CodePanel
          title="Mock canonical artifact JSON"
          subtitle="Readable local mock representation for diligence review"
          value={canonicalArtifact}
        />
      </div>
    </div>
  );
}
