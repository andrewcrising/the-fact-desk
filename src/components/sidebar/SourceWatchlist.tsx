import { SidebarPanel } from "@/components/ui/SidebarPanel";
import type { Story } from "@/types/story";

interface SourceWatchlistProps {
  stories: Story[];
}

export function SourceWatchlist({ stories }: SourceWatchlistProps) {
  const counts = new Map<string, number>();
  for (const story of stories) {
    for (const source of story.sources) {
      counts.set(source, (counts.get(source) ?? 0) + 1);
    }
  }

  const activeSources = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8);

  if (activeSources.length === 0) return null;

  return (
    <SidebarPanel title="Active Source Network">
      <ul className="divide-y divide-[var(--border-subtle)]">
        {activeSources.map(([source, storyCount]) => (
          <li key={source} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
            <p className="text-[13px] font-semibold leading-snug text-[var(--foreground)]">
              {source}
            </p>
            <span className="shrink-0 font-mono text-[10px] text-[var(--muted-light)]">
              {storyCount} {storyCount === 1 ? "item" : "items"}
            </span>
          </li>
        ))}
      </ul>
    </SidebarPanel>
  );
}
