export type ScreenId =
  | "overview"
  | "execution-intake"
  | "artifact-viewer"
  | "replay-verification"
  | "certification-record"
  | "lineage-explorer"
  | "architecture-view"
  | "external-verifier"
  | "access-mode";

export type VerificationStatus =
  | "canonicalized"
  | "verified"
  | "review"
  | "pending"
  | "discrepancy";

export interface ExecutionEnvelope {
  executionId: string;
  modelRuntimeProfile: string;
  policyManifestId: string;
  environmentFingerprint: string;
  declaredToleranceLimits: {
    numericDrift: string;
    tokenBoundary: string;
    ordering: string;
  };
  inputCommitment: string;
  outputCommitment: string;
  receivedAt: string;
}

export interface CanonicalArtifact {
  artifactId: string;
  policyManifestRef: string;
  runtimeMetadata: {
    runtime: string;
    modelProfile: string;
    acceleratorClass: string;
    containerImage: string;
  };
  numericNormalizationProfile: {
    precision: string;
    rounding: string;
    tensorEncoding: string;
  };
  verificationDigest: string;
  predecessorArtifactHash: string;
  timestamp: string;
  status: VerificationStatus;
}

export interface ReplayComparisonField {
  field: string;
  original: string;
  replay: string;
  result: "match" | "within tolerance" | "mismatch";
}

export interface ReplayScenario {
  id: "passing" | "failing";
  label: string;
  originalDigest: string;
  replayDigest: string;
  equivalenceResult: "Equivalent" | "Discrepancy detected";
  toleranceCheck: "Passed" | "Failed";
  fields: ReplayComparisonField[];
  discrepancyReport?: string[];
}

export interface CertificateArtifact {
  certificateId: string;
  sessionRoot: string;
  policyManifestId: string;
  verificationDigest: string;
  toleranceProfile: string;
  signatureMetadata: {
    algorithm: string;
    signer: string;
    status: string;
  };
  issuedAt: string;
}

export interface LineageNode {
  artifactId: string;
  predecessorHash: string;
  sessionRoot: string;
  verificationDigest: string;
  label: string;
}
