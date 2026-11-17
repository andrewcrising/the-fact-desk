"use client";

import { STORY_CATEGORIES } from "@/data/navigation";
import { cn } from "@/lib/cn";
import type { StoryCategory } from "@/types/story";
import type { KeyboardEvent } from "react";

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
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const current = tabs.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 :
      (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus();
    tabs[next].click();
  }

  return (
    <div className="relative -mx-1 border-b border-[var(--border-subtle)]">
      <div
        className="flex gap-0 overflow-x-auto pb-0"
        role="tablist"
        aria-label="Filter by category"
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          role="tab"
          aria-selected={active === null}
          tabIndex={active === null ? 0 : -1}
          onClick={() => onChange(null)}
          className={cn(
            "shrink-0 border-b-2 px-3 py-2.5 text-xs font-medium sm:px-4 sm:text-[13px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)]",
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
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(category)}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2.5 text-xs font-medium sm:px-4 sm:text-[13px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)]",
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
