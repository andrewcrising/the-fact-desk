import type { CanonicalArtifact } from "../types/ridge";

export const canonicalArtifact: CanonicalArtifact = {
  artifactId: "art_rdg_canonical_000184",
  policyManifestRef: "pmf_ridge_diligence_0042",
  runtimeMetadata: {
    runtime: "RIDGE deterministic execution evidence adapter",
    modelProfile: "verifier-profile:gpt-runtime-compatible:v3",
    acceleratorClass: "accelerator-runtime-class:a100-compatible",
    containerImage: "registry.example/ridge-runtime@sha256:6f1d9a2c"
  },
  numericNormalizationProfile: {
    precision: "fp32-normalized",
    rounding: "nearest-even",
    tensorEncoding: "canonical-row-major-v2"
  },
  verificationDigest: "vrd_77c2a6f1ef129e934e5f68b210bb8ce4",
  predecessorArtifactHash: "sha256:0000c3b3b459f74ea63cf53f63ad8f18a791e9d425e9db3a89fe148ba01a0017",
  timestamp: "2026-05-25T15:08:08.000Z",
  status: "canonicalized"
};
