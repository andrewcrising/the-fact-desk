interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  tone?: "cyan" | "mint" | "amber";
}

const toneClasses = {
  cyan: "from-ridge-cyan/20 to-ridge-cyan/0 text-ridge-cyan",
  mint: "from-ridge-mint/20 to-ridge-mint/0 text-ridge-mint",
  amber: "from-ridge-amber/20 to-ridge-amber/0 text-ridge-amber"
};

export function MetricCard({ label, value, detail, tone = "cyan" }: MetricCardProps) {
  return (
    <article className="panel overflow-hidden rounded-2xl p-5">
      <div className={`mb-4 h-1.5 rounded-full bg-gradient-to-r ${toneClasses[tone]}`} />
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <div className="mt-3 break-words text-3xl font-semibold text-slate-50">{value}</div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
    </article>
  );
}
