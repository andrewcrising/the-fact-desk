import { formatStoryTime, rankStoriesByPriority } from "@/lib/stories";
import type { Story } from "@/types/story";
import Link from "next/link";

interface HealthDeskPlaceholderProps {
  stories: Story[];
}

export function HealthDeskPlaceholder({ stories }: HealthDeskPlaceholderProps) {
  const healthStories = rankStoriesByPriority(
    stories.filter((story) => story.category === "Health"),
  );
  const latest = healthStories[0];

  return (
    <section
      id="health-desk-sidebar"
      className="desk-card overflow-hidden"
      aria-label="Health Desk live summary"
    >
      <div className="border-b border-[var(--border-subtle)] bg-[#fafbfc] px-3 py-2">
        <p className="desk-kicker text-[9px]">Health Desk · Live</p>
      </div>
      <div className="px-3 py-2.5">
        {latest ? (
          <>
            <Link
              href={`/story/${latest.slug}`}
              className="text-[12px] font-medium leading-snug text-[var(--foreground)] hover:text-[var(--accent)]"
            >
              {latest.title}
            </Link>
            <p className="mt-1 font-mono text-[10px] text-[var(--muted-light)]">
              {healthStories.length} current health {healthStories.length === 1 ? "item" : "items"} · updated {formatStoryTime(latest.updatedAt)}
            </p>
          </>
        ) : (
          <p className="text-[11px] leading-snug text-[var(--muted)]">
            No live health items are available right now.
          </p>
        )}
        <Link
          href="/#health-desk"
          className="mt-2 inline-block text-[11px] text-[var(--accent)] hover:underline"
        >
          View Health Desk →
        </Link>
      </div>
    </section>
  );
}
