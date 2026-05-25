import { ConfidenceLabel } from "@/components/ui/ConfidenceLabel";
import { SidebarPanel } from "@/components/ui/SidebarPanel";
import { liveSignals } from "@/data/mockSidebar";
import type { Confidence } from "@/types/story";

const labelToConfidence: Record<string, Confidence> = {
  Developing: "Developing",
  Disputed: "Disputed",
  Confirmed: "Confirmed",
};

export function LiveSignals() {
  return (
    <SidebarPanel
      title="Live Signals"
      action={
        <span className="h-2 w-2 rounded-full bg-emerald-600" title="Desk active" />
      }
    >
      <ul className="divide-y divide-[var(--border-subtle)]">
        {liveSignals.map((signal) => {
          const confidence =
            labelToConfidence[signal.label] ?? "Developing";
          return (
            <li key={signal.id} className="py-3 first:pt-0 last:pb-0">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <ConfidenceLabel confidence={confidence} />
                <span className="font-mono text-[10px] text-[var(--muted-light)]">
                  {signal.time}
                </span>
              </div>
              <p className="text-[13px] leading-snug text-[var(--foreground)]">
                {signal.detail}
              </p>
            </li>
          );
        })}
      </ul>
    </SidebarPanel>
  );
}
