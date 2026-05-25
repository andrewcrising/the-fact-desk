import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface DeskLabelProps {
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3" | "p";
  id?: string;
}

export function DeskLabel({
  children,
  className,
  as: Tag = "h2",
  id,
}: DeskLabelProps) {
  return (
    <Tag id={id} className={cn("desk-kicker text-[var(--muted)]", className)}>
      {children}
    </Tag>
  );
}
