import type { LineageNode } from "../types/ridge";

export const mockLineage: LineageNode[] = [
  {
    artifactId: "art_rdg_canonical_000181",
    predecessorHash: "genesis",
    sessionRoot: "sr_2b34c7d184e403b4",
    verificationDigest: "vrd_16ab2f4d2f870e10",
    label: "Sample declared envelope received"
  },
  {
    artifactId: "art_rdg_canonical_000182",
    predecessorHash: "sha256:910a3d7f3a48bd11",
    sessionRoot: "sr_4e89f05aa6217c30",
    verificationDigest: "vrd_3f241c7044a6e2dd",
    label: "Mock canonical execution artifact emitted"
  },
  {
    artifactId: "art_rdg_canonical_000183",
    predecessorHash: "sha256:b3405de708df8521",
    sessionRoot: "sr_7f6c1816ad4f89a2",
    verificationDigest: "vrd_51c2d4fc90bb0a63",
    label: "Sample deterministic replay verified"
  },
  {
    artifactId: "art_rdg_canonical_000184",
    predecessorHash: "sha256:0000c3b3b459f74e",
    sessionRoot: "sr_9a7d2c1f4385be6d",
    verificationDigest: "vrd_77c2a6f1ef129e93",
    label: "Mock certification artifact issued"
  }
];
