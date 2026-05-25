import { cn } from "@/lib/cn";
import type { Confidence } from "@/types/story";

const styles: Record<Confidence, string> = {
  Confirmed: "bg-emerald-50 text-emerald-900 ring-emerald-200/80",
  Developing: "bg-sky-50 text-sky-900 ring-sky-200/80",
  Disputed: "bg-amber-50 text-amber-900 ring-amber-200/80",
  "Single-source": "bg-slate-100 text-slate-700 ring-slate-200",
};

interface ConfidenceLabelProps {
  confidence: Confidence;
  className?: string;
}

export function ConfidenceLabel({ confidence, className }: ConfidenceLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        styles[confidence],
        className,
      )}
    >
      {confidence}
    </span>
  );
}
