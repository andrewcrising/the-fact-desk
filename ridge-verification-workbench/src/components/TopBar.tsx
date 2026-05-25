import { StatusBadge } from "./StatusBadge";

interface TopBarProps {
  activeLabel: string;
}

export function TopBar({ activeLabel }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-ridge-border/80 bg-ridge-ink/75 px-5 py-4 backdrop-blur md:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-ridge-cyan">RIDGE Verification Workbench</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-50">{activeLabel}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status="verified" label="Mock evidence active" />
          <span className="rounded-full border border-ridge-border bg-ridge-panelSoft px-3 py-1.5 font-mono text-xs text-slate-400">
            frontend-only v1
          </span>
        </div>
      </div>
    </header>
  );
}
