import { cn } from "@/lib/cn";

type SectionVariant = "confirmed" | "claims" | "missing" | "framing";

const variantAccent: Record<SectionVariant, string> = {
  confirmed: "border-l-emerald-600",
  claims: "border-l-amber-500",
  missing: "border-l-slate-400",
  framing: "border-l-[var(--accent-muted)]",
};

interface SectionListProps {
  title: string;
  items: string[];
  emptyMessage?: string;
  variant?: SectionVariant;
}

export function SectionList({
  title,
  items,
  emptyMessage = "None listed.",
  variant = "framing",
}: SectionListProps) {
  return (
    <div
      className={cn(
        "border border-[var(--border-subtle)] bg-white p-3 sm:p-4",
        "border-l-[3px]",
        variantAccent[variant],
      )}
    >
      <h4 className="desk-kicker mb-2 text-[10px]">{title}</h4>
      {items.length > 0 ? (
        <ul className="space-y-2 text-[13px] leading-snug text-[var(--foreground)] sm:text-sm">
          {items.map((item, i) => (
            <li key={i} className="pl-0.5">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-[var(--muted-light)]">{emptyMessage}</p>
      )}
    </div>
  );
}
