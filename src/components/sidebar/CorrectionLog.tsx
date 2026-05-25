import { SidebarPanel } from "@/components/ui/SidebarPanel";
import { correctionLog } from "@/data/mockSidebar";

export function CorrectionLog() {
  return (
    <SidebarPanel title="Correction Log">
      <ul className="divide-y divide-[var(--border-subtle)]">
        {correctionLog.map((entry) => (
          <li key={entry.id} className="py-3 first:pt-0 last:pb-0">
            <p className="text-[13px] font-semibold leading-snug text-[var(--foreground)]">
              {entry.headline}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted)]">
              {entry.correction}
            </p>
            <p className="mt-1.5 font-mono text-[10px] text-[var(--muted-light)]">
              {entry.date}
            </p>
          </li>
        ))}
      </ul>
    </SidebarPanel>
  );
}
