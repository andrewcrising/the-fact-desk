import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface DeskCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "featured";
  id?: string;
}

export function DeskCard({
  children,
  className,
  variant = "default",
  id,
}: DeskCardProps) {
  return (
    <div
      id={id}
      className={cn(
        variant === "featured" ? "desk-card-featured" : "desk-card",
        className,
      )}
    >
      {children}
    </div>
  );
}
