import { FlowStep } from "../components/FlowStep";
import { CodePanel } from "../components/CodePanel";
import { mockCertificate } from "../data/mockCertificates";

const verifierSteps = [
  {
    title: "Receive sample certification artifact",
    description: "A demo external verifier receives a sample certification artifact and declared execution envelope references."
  },
  {
    title: "Retrieve sample policy manifest",
    description: "The verifier flow loads the policy manifest referenced by the mock certification record."
  },
  {
    title: "Replay sample artifact",
    description: "The demo verifier simulates replay under the declared execution envelope."
  },
  {
    title: "Simulated recomputation",
    description: "The demo verifier simulates recomputing the verification digest from normalized mock evidence."
  },
  {
    title: "Mock session-root comparison",
    description: "The demo verifier simulates comparing the recomputed digest against sample session-root continuity."
  },
  {
    title: "Demo audit receipt",
    description: "The verifier flow displays a sample audit receipt shape for downstream governance consumers."
  }
];

const auditReceipt = {
  receiptId: "audit_receipt_demo_000184",
  certificateId: mockCertificate.certificateId,
  policyManifestId: mockCertificate.policyManifestId,
  digestRecomputed: "simulated",
  sessionRootCompared: "mock comparison",
  verifier: "external.verifier.demo",
  result: "demo accepted outcome from mock evidence"
};

export function ExternalVerifier() {
  return (
    <div className="space-y-6">
      <section className="panel rounded-3xl p-6">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-ridge-cyan">External verifier</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Third-party verification flow</h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-400">
          RIDGE-certified artifacts can be consumed by an external verifier that recomputes digests, compares session roots, and emits an audit receipt. In this prototype, those verifier outcomes are simulated with mock evidence; the downstream governance consumer decides how to use a real receipt.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {verifierSteps.map((step, index) => (
          <FlowStep key={step.title} index={index + 1} title={step.title} description={step.description} />
        ))}
      </section>

      <CodePanel title="Demo audit receipt" subtitle="simulated external verifier output shape" value={auditReceipt} />
    </div>
  );
}
