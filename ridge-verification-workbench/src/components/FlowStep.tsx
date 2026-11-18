interface FlowStepProps {
  index: number;
  title: string;
  description: string;
}

export function FlowStep({ index, title, description }: FlowStepProps) {
  return (
    <div className="relative rounded-2xl border border-ridge-border/80 bg-ridge-panelSoft/70 p-4">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full border border-ridge-cyan/30 bg-ridge-cyan/10 font-mono text-sm text-ridge-cyan">
        {String(index).padStart(2, "0")}
      </div>
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}
