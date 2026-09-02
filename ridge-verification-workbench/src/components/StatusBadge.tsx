import type { VerificationStatus } from "../types/ridge";
import { toTitleCase } from "../utils/formatters";

const statusStyles: Record<VerificationStatus, string> = {
  canonicalized: "border-ridge-cyan/40 bg-ridge-cyan/10 text-ridge-cyan",
  verified: "border-ridge-mint/40 bg-ridge-mint/10 text-ridge-mint",
  review: "border-ridge-amber/40 bg-ridge-amber/10 text-ridge-amber",
  pending: "border-slate-400/30 bg-slate-400/10 text-slate-300",
  discrepancy: "border-ridge-red/40 bg-ridge-red/10 text-ridge-red"
};

interface StatusBadgeProps {
  status: VerificationStatus;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}>
      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? toTitleCase(status)}
    </span>
  );
}
