interface CodePanelProps {
  title: string;
  subtitle?: string;
  value: unknown;
}

export function CodePanel({ title, subtitle, value }: CodePanelProps) {
  const code = typeof value === "string" ? value : JSON.stringify(value, null, 2);

  return (
    <section className="panel rounded-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-ridge-border/70 px-5 py-4">
        <div>
          <h3 className="font-semibold text-slate-100">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        <div className="flex gap-1.5 pt-1">
          <span className="h-2.5 w-2.5 rounded-full bg-ridge-red/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-ridge-amber/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-ridge-mint/70" />
        </div>
      </div>
      <pre className="code-scrollbar max-h-[520px] overflow-auto p-5 text-sm leading-6 text-slate-300">
        <code>{code}</code>
      </pre>
    </section>
  );
}
