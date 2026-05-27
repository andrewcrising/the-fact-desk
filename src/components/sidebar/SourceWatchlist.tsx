import { SidebarPanel } from "@/components/ui/SidebarPanel";
import { watchlistSources } from "@/data/mockSidebar";

export function SourceWatchlist() {
  return (
    <SidebarPanel title="Source Watchlist (beta)">
      <p className="mb-2 text-[11px] leading-relaxed text-[var(--muted-light)]">
        Demo watchlist copy; source scoring metadata lives in the MVP schema.
      </p>
      <ul className="divide-y divide-[var(--border-subtle)]">
        {watchlistSources.map((source) => (
          <li key={source.id} className="py-3 first:pt-0 last:pb-0">
            <p className="text-[13px] font-semibold leading-snug text-[var(--foreground)]">
              {source.name}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-light)]">
              {source.note}
            </p>
          </li>
        ))}
      </ul>
    </SidebarPanel>
  );
}
