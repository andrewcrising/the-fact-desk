import { DeskLabel } from "@/components/ui/DeskLabel";
import type { Story } from "@/types/story";
import { StoryCard } from "./StoryCard";

interface StorySectionProps {
  id: string;
  title: string;
  description?: string;
  stories: Story[];
}

export function StorySection({
  id,
  title,
  description,
  stories,
}: StorySectionProps) {
  if (stories.length === 0) return null;

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-20 space-y-2"
    >
      <div>
        <DeskLabel id={`${id}-heading`}>{title}</DeskLabel>
        {description && (
          <p className="mt-0.5 text-xs text-[var(--muted)]">{description}</p>
        )}
      </div>
      <div className="space-y-2">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
}
