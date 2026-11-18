import { cn } from "@/lib/cn";
import type { EvidenceLevel } from "@/types/story";

const styles: Record<EvidenceLevel, string> = {
  Low: "bg-amber-50 text-amber-900 ring-amber-200/80",
  Moderate: "bg-sky-50 text-sky-900 ring-sky-200/80",
  Strong: "bg-emerald-50 text-emerald-900 ring-emerald-200/80",
};

interface EvidenceLabelProps {
  evidenceLevel?: EvidenceLevel;
  className?: string;
}

export function EvidenceLabel({
  evidenceLevel = "Moderate",
  className,
}: EvidenceLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        styles[evidenceLevel],
        className,
      )}
    >
      {evidenceLevel} evidence
    </span>
  );
}
