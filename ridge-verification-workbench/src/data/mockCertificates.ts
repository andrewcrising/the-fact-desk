import type { CertificateArtifact } from "../types/ridge";

export const mockCertificate: CertificateArtifact = {
  certificateId: "cert_rdg_2026_05_25_000184",
  sessionRoot: "sr_9a7d2c1f4385be6ddc729fdaf07c1b582a69cd85d2074d1e85e6069ff6f81245",
  policyManifestId: "pmf_ridge_diligence_0042",
  verificationDigest: "vrd_77c2a6f1ef129e934e5f68b210bb8ce4",
  toleranceProfile: "deterministic-replay:strict-envelope:v1",
  signatureMetadata: {
    algorithm: "placeholder-ed25519-detached",
    signer: "demo.verifier.ridge.local",
    status: "signature service not connected in v1"
  },
  issuedAt: "2026-05-25T15:08:24.000Z"
};
