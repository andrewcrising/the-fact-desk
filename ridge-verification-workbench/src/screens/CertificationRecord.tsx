import { CodePanel } from "../components/CodePanel";
import { StatusBadge } from "../components/StatusBadge";
import { mockCertificate } from "../data/mockCertificates";
import { downloadJson } from "../utils/digest";
import { formatDateTime } from "../utils/formatters";

export function CertificationRecord() {
  function handleExportJson() {
    downloadJson(`${mockCertificate.certificateId}.json`, mockCertificate);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_440px]">
      <section className="space-y-6">
        <div className="panel rounded-3xl p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-ridge-cyan">Certification artifact</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-50">{mockCertificate.certificateId}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
                The certification record packages verified replay evidence, the session root, the policy manifest ID, tolerance profile, and placeholder signature metadata for external verifier review.
              </p>
            </div>
            <StatusBadge status="verified" label="Certification ready" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Detail label="Session root" value={mockCertificate.sessionRoot} />
          <Detail label="Policy manifest ID" value={mockCertificate.policyManifestId} />
          <Detail label="Verification digest" value={mockCertificate.verificationDigest} />
          <Detail label="Tolerance profile" value={mockCertificate.toleranceProfile} />
          <Detail label="Issued at" value={formatDateTime(mockCertificate.issuedAt)} />
          <Detail label="Signature metadata" value={`${mockCertificate.signatureMetadata.algorithm} / ${mockCertificate.signatureMetadata.status}`} />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="rounded-xl border border-ridge-cyan/50 bg-ridge-cyan/10 px-5 py-3 text-sm font-semibold text-ridge-cyan transition hover:bg-ridge-cyan/20"
          >
            Export JSON
          </button>
          <button
            type="button"
            className="rounded-xl border border-ridge-border bg-ridge-panelSoft px-5 py-3 text-sm font-semibold text-slate-300 opacity-75"
            title="Placeholder for a future signed certificate export service"
          >
            Export certificate placeholder
          </button>
        </div>
      </section>

      <CodePanel title="Current mock certificate" subtitle="client-side downloadable JSON" value={mockCertificate} />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ridge-border/70 bg-ridge-panelSoft/60 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 break-words font-mono text-sm leading-6 text-slate-200">{value}</p>
    </div>
  );
}
