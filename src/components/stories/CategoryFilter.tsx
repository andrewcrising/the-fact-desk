"use client";

import { STORY_CATEGORIES } from "@/data/navigation";
import { cn } from "@/lib/cn";
import type { StoryCategory } from "@/types/story";

interface CategoryFilterProps {
  active: StoryCategory | null;
  onChange: (category: StoryCategory | null) => void;
  counts?: Partial<Record<StoryCategory, number>>;
}

export function CategoryFilter({
  active,
  onChange,
  counts,
}: CategoryFilterProps) {
  return (
    <div className="relative -mx-1 border-b border-[var(--border-subtle)]">
      <div
        className="flex gap-0 overflow-x-auto pb-0"
        role="tablist"
        aria-label="Filter by category"
      >
        <button
          type="button"
          role="tab"
          aria-selected={active === null}
          onClick={() => onChange(null)}
          className={cn(
            "shrink-0 border-b-2 px-3 py-2.5 text-xs font-medium sm:px-4 sm:text-[13px]",
            active === null
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]",
          )}
        >
          All desks
        </button>
        {STORY_CATEGORIES.map((category) => {
          const isActive = active === category;
          const count = counts?.[category];

          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(category)}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2.5 text-xs font-medium sm:px-4 sm:text-[13px]",
                isActive
                  ? "border-[var(--accent)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]",
              )}
            >
              {category}
              {count !== undefined && (
                <span className="ml-1.5 font-mono text-[10px] tabular-nums text-[var(--muted-light)]">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
