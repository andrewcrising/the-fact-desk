import { cn } from "@/lib/cn";
import type { Signal } from "@/types/story";

const styles: Record<Signal, string> = {
  "Top Signal": "bg-[var(--accent)]/10 text-[var(--accent)] ring-[var(--accent)]/20",
  "Under-covered": "bg-slate-100 text-slate-700 ring-slate-200",
  "Cross-angle": "bg-indigo-50 text-indigo-900 ring-indigo-200/80",
  Developing: "bg-stone-100 text-stone-700 ring-stone-200",
};

interface SignalLabelProps {
  signal: Signal;
  className?: string;
}

export function SignalLabel({ signal, className }: SignalLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-medium tracking-wide ring-1 ring-inset",
        styles[signal],
        className,
      )}
    >
      {signal}
    </span>
  );
}
