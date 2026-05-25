import type { ScreenId } from "../types/ridge";

export interface NavItem {
  id: ScreenId;
  label: string;
  eyebrow: string;
}

interface SidebarProps {
  items: NavItem[];
  activeScreen: ScreenId;
  onSelect: (screen: ScreenId) => void;
}

export function Sidebar({ items, activeScreen, onSelect }: SidebarProps) {
  return (
    <aside className="border-r border-ridge-border/80 bg-ridge-ink/80 p-4 backdrop-blur xl:min-h-screen">
      <div className="mb-8 rounded-2xl border border-ridge-cyan/20 bg-ridge-cyan/10 p-4">
        <div className="font-mono text-xs uppercase tracking-[0.28em] text-ridge-cyan">RIDGE / VERA</div>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-50">Verification Workbench</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Deterministic execution evidence for replayable, certifiable AI outcomes.
        </p>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const selected = item.id === activeScreen;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                selected
                  ? "border-ridge-cyan/50 bg-ridge-cyan/10 text-slate-50"
                  : "border-transparent text-slate-400 hover:border-ridge-border hover:bg-ridge-panelSoft/70 hover:text-slate-100"
              }`}
            >
              <span className="block text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">{item.eyebrow}</span>
              <span className="mt-1 block text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
