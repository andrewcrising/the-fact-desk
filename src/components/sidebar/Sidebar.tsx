import type { Story } from "@/types/story";
import { HealthDeskPlaceholder } from "./HealthDeskPlaceholder";
import { LiveSignals } from "./LiveSignals";
import { SourceWatchlist } from "./SourceWatchlist";

interface SidebarProps {
  stories: Story[];
}

export function Sidebar({ stories }: SidebarProps) {
  return (
    <>
      <HealthDeskPlaceholder stories={stories} />
      <LiveSignals stories={stories} />
      <SourceWatchlist stories={stories} />
    </>
  );
}
