import { getDeskStats } from "@/lib/stories";
import type { Story } from "@/types/story";

interface DeskTickerProps {
  stories: Story[];
}

const STAT_ITEMS = [
  { key: "topSignals" as const, label: "Top signals" },
  { key: "underCovered" as const, label: "Under-covered" },
  { key: "developing" as const, label: "Developing" },
  { key: "sourcesTracked" as const, label: "Sources tracked" },
] as const;

export function DeskTicker({ stories }: DeskTickerProps) {
  const stats = getDeskStats(stories);

  return (
    <div
      className="overflow-x-auto border border-[var(--border-subtle)] bg-white"
      aria-label="Desk signal ticker"
    >
      <div className="flex min-w-max divide-x divide-[var(--border-subtle)]">
        {STAT_ITEMS.map(({ key, label }) => (
          <div key={key} className="shrink-0 px-3 py-1.5 sm:px-4">
            <span className="desk-kicker text-[8px] text-[var(--muted-light)]">
              {label}
            </span>
            <span className="ml-1.5 font-mono text-sm font-semibold tabular-nums text-[var(--foreground)]">
              {stats[key]}
            </span>
          </div>
        ))}
        <div className="shrink-0 px-3 py-1.5 sm:px-4">
          <span className="desk-kicker text-[8px] text-[var(--muted-light)]">
            Credibility
          </span>
          <span className="ml-1.5 text-[11px] font-medium text-[var(--muted)]">
            Labels active
          </span>
        </div>
      </div>
    </div>
  );
}
