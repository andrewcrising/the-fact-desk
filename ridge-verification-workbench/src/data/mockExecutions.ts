import type { ExecutionEnvelope, ReplayScenario } from "../types/ridge";

export const mockExecutionEnvelope: ExecutionEnvelope = {
  executionId: "exec_rdg_2026_05_25_0018",
  modelRuntimeProfile: "verifier-profile:gpt-runtime-compatible:v3",
  policyManifestId: "pmf_ridge_diligence_0042",
  environmentFingerprint: "env_6f1d9a2c3b84e71d",
  declaredToleranceLimits: {
    numericDrift: "<= 0.000001 normalized tensor delta",
    tokenBoundary: "exact canonical token sequence",
    ordering: "stable deterministic ordering required"
  },
  inputCommitment: "sha256:65f5d8a1b55c93a6d6e2c89a7c06f39ad0b7de6a8e2c18a1f14bd3df5f140671",
  outputCommitment: "sha256:df40a3526a8fd524e92301e8e06f778d3a4d8e15c9d56ae3fe98dfe5f3f3e3a4",
  receivedAt: "2026-05-25T15:08:00.000Z"
};

export const replayScenarios: ReplayScenario[] = [
  {
    id: "passing",
    label: "Passing replay equivalence",
    originalDigest: "vrd_77c2a6f1ef129e934e5f68b210bb8ce4",
    replayDigest: "vrd_77c2a6f1ef129e934e5f68b210bb8ce4",
    equivalenceResult: "Equivalent",
    toleranceCheck: "Passed",
    fields: [
      {
        field: "input commitment",
        original: "sha256:65f5...0671",
        replay: "sha256:65f5...0671",
        result: "match"
      },
      {
        field: "output commitment",
        original: "sha256:df40...e3a4",
        replay: "sha256:df40...e3a4",
        result: "match"
      },
      {
        field: "normalized tensor delta",
        original: "0.00000031",
        replay: "0.00000031",
        result: "within tolerance"
      },
      {
        field: "runtime metadata",
        original: "container rdg-runtime@6f1d",
        replay: "container rdg-runtime@6f1d",
        result: "match"
      }
    ]
  },
  {
    id: "failing",
    label: "Failing replay equivalence",
    originalDigest: "vrd_77c2a6f1ef129e934e5f68b210bb8ce4",
    replayDigest: "vrd_b0c91b7ea40687fb4dff12d5ee2a319d",
    equivalenceResult: "Discrepancy detected",
    toleranceCheck: "Failed",
    fields: [
      {
        field: "input commitment",
        original: "sha256:65f5...0671",
        replay: "sha256:65f5...0671",
        result: "match"
      },
      {
        field: "output commitment",
        original: "sha256:df40...e3a4",
        replay: "sha256:8a73...d911",
        result: "mismatch"
      },
      {
        field: "normalized tensor delta",
        original: "0.00000031",
        replay: "0.00001980",
        result: "mismatch"
      },
      {
        field: "runtime metadata",
        original: "container rdg-runtime@6f1d",
        replay: "container rdg-runtime@6f1d",
        result: "match"
      }
    ],
    discrepancyReport: [
      "Replay artifact did not reproduce the declared output commitment.",
      "Numeric normalization exceeded the declared execution envelope.",
      "RIDGE emits discrepancy evidence for downstream governance consumers; it does not block, override, or alter execution."
    ]
  }
];
