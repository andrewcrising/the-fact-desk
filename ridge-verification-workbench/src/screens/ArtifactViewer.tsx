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
            <h1 className="mt-3 text-3xl font-semibold text-slate-50">{canonicalArtifact.artifactId}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
              A canonical execution artifact packages the declared envelope, runtime metadata, numeric normalization profile, predecessor artifact hash, and verification digest in a readable evidence object.
            </p>
          </div>
          <StatusBadge status="canonicalized" />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <ArtifactCard
            label="Verification digest"
            title="Digest-bound canonical artifact"
            digest={canonicalArtifact.verificationDigest}
            detail="Digest computed from normalized execution evidence and policy manifest references."
            status="canonicalized"
          />
          <div className="panel rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Timestamp</p>
            <p className="mt-3 text-lg font-semibold text-slate-100">{formatDateTime(canonicalArtifact.timestamp)}</p>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Predecessor artifact hash: <span className="font-mono text-ridge-cyan">{canonicalArtifact.predecessorArtifactHash}</span>
            </p>
          </div>
        </div>
        <CodePanel
          title="Canonical artifact JSON"
          subtitle="Readable local representation for diligence review"
          value={canonicalArtifact}
        />
      </div>
    </div>
  );
}
