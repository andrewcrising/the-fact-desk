import { CorrectionLog } from "./CorrectionLog";
import { DailyBriefSignup } from "./DailyBriefSignup";
import { HealthDeskPlaceholder } from "./HealthDeskPlaceholder";
import { LiveSignals } from "./LiveSignals";
import { SourceWatchlist } from "./SourceWatchlist";

export function Sidebar() {
  return (
    <>
      <HealthDeskPlaceholder />
      <LiveSignals />
      <SourceWatchlist />
      <CorrectionLog />
      <DailyBriefSignup />
    </>
  );
}
