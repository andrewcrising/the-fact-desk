import { DeskLabel } from "@/components/ui/DeskLabel";
import type { ReactNode } from "react";

interface SidebarPanelProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

export function SidebarPanel({ title, children, action }: SidebarPanelProps) {
  return (
    <section className="desk-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[#fafbfc] px-4 py-2.5">
        <DeskLabel as="h3" className="!text-[var(--foreground)]">
          {title}
        </DeskLabel>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
