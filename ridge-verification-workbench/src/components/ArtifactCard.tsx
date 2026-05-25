import { StatusBadge } from "./StatusBadge";
import type { VerificationStatus } from "../types/ridge";

interface ArtifactCardProps {
  label: string;
  title: string;
  digest: string;
  detail: string;
  status: VerificationStatus;
}

export function ArtifactCard({ label, title, digest, detail, status }: ArtifactCardProps) {
  return (
    <article className="panel rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
          <h3 className="mt-3 text-lg font-semibold text-slate-100">{title}</h3>
        </div>
        <StatusBadge status={status} />
      </div>
      <p className="mt-4 font-mono text-sm text-ridge-cyan">{digest}</p>
      <p className="mt-4 text-sm leading-6 text-slate-400">{detail}</p>
    </article>
  );
}
