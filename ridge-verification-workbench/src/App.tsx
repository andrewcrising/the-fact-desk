import { useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import type { NavItem } from "./components/Sidebar";
import type { ScreenId } from "./types/ridge";
import { ArchitectureView } from "./screens/ArchitectureView";
import { ArtifactViewer } from "./screens/ArtifactViewer";
import { CertificationRecord } from "./screens/CertificationRecord";
import { ExecutionIntake } from "./screens/ExecutionIntake";
import { ExternalVerifier } from "./screens/ExternalVerifier";
import { LineageExplorer } from "./screens/LineageExplorer";
import { Overview } from "./screens/Overview";
import { ReplayVerification } from "./screens/ReplayVerification";
import { AccessMode } from "./screens/AccessMode";

const navItems: NavItem[] = [
  { id: "overview", label: "Overview Dashboard", eyebrow: "01" },
  { id: "execution-intake", label: "Execution Intake", eyebrow: "02" },
  { id: "artifact-viewer", label: "Canonical Artifact", eyebrow: "03" },
  { id: "replay-verification", label: "Replay Verification", eyebrow: "04" },
  { id: "certification-record", label: "Certification Record", eyebrow: "05" },
  { id: "lineage-explorer", label: "Lineage Explorer", eyebrow: "06" },
  { id: "architecture-view", label: "Architecture View", eyebrow: "07" },
  { id: "external-verifier", label: "External Verifier", eyebrow: "08" },
  { id: "access-mode", label: "Access Mode", eyebrow: "09" }
];

function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("overview");
  const activeLabel = useMemo(
    () => navItems.find((item) => item.id === activeScreen)?.label ?? "Overview Dashboard",
    [activeScreen]
  );

  return (
    <AppShell items={navItems} activeScreen={activeScreen} activeLabel={activeLabel} onSelect={setActiveScreen}>
      {renderScreen(activeScreen)}
    </AppShell>
  );
}

function renderScreen(screen: ScreenId) {
  switch (screen) {
    case "execution-intake":
      return <ExecutionIntake />;
    case "artifact-viewer":
      return <ArtifactViewer />;
    case "replay-verification":
      return <ReplayVerification />;
    case "certification-record":
      return <CertificationRecord />;
    case "lineage-explorer":
      return <LineageExplorer />;
    case "architecture-view":
      return <ArchitectureView />;
    case "external-verifier":
      return <ExternalVerifier />;
    case "access-mode":
      return <AccessMode />;
    case "overview":
    default:
      return <Overview />;
  }
}

export default App;
