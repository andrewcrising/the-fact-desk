import { FlowStep } from "../components/FlowStep";
import { CodePanel } from "../components/CodePanel";
import { mockCertificate } from "../data/mockCertificates";

const verifierSteps = [
  {
    title: "Receive certification artifact",
    description: "An external verifier receives a certification artifact and its declared execution envelope references."
  },
  {
    title: "Retrieve policy manifest",
    description: "The verifier loads the policy manifest referenced by the certification record."
  },
  {
    title: "Replay artifact",
    description: "The verifier replays the artifact under the declared execution envelope."
  },
  {
    title: "Recompute digest",
    description: "The verifier recomputes the verification digest from normalized evidence."
  },
  {
    title: "Compare session root",
    description: "The recomputed digest is checked against append-only session-root continuity."
  },
  {
    title: "Emit audit receipt",
    description: "The verifier emits an audit receipt for downstream governance consumers."
  }
];

const auditReceipt = {
  receiptId: "audit_receipt_demo_000184",
  certificateId: mockCertificate.certificateId,
  policyManifestId: mockCertificate.policyManifestId,
  digestRecomputed: true,
  sessionRootCompared: true,
  verifier: "external.verifier.demo",
  result: "verification digest and session root accepted"
};

export function ExternalVerifier() {
  return (
    <div className="space-y-6">
      <section className="panel rounded-3xl p-6">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-ridge-cyan">External verifier</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Third-party verification flow</h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-400">
          RIDGE-certified artifacts can be consumed by an external verifier that recomputes digests, compares session roots, and emits an audit receipt. The downstream governance consumer decides how to use that receipt.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {verifierSteps.map((step, index) => (
          <FlowStep key={step.title} index={index + 1} title={step.title} description={step.description} />
        ))}
      </section>

      <CodePanel title="Audit receipt mock" subtitle="external verifier output shape" value={auditReceipt} />
    </div>
  );
}
