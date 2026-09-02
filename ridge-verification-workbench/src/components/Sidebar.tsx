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
    <aside className="border-b border-ridge-border/80 bg-ridge-ink/80 p-3 backdrop-blur sm:p-4 lg:sticky lg:top-0 lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="mb-4 rounded-2xl border border-ridge-cyan/20 bg-ridge-cyan/10 p-3 lg:mb-8 lg:p-4">
        <div className="font-mono text-xs uppercase tracking-[0.28em] text-ridge-cyan">RIDGE / VERA</div>
        <h1 className="mt-2 text-lg font-semibold tracking-tight text-slate-50 lg:mt-3 lg:text-xl">Verification Workbench</h1>
        <p className="mt-2 hidden text-sm leading-6 text-slate-400 sm:block lg:mt-3">
          Deterministic execution evidence for replayable, certifiable AI outcomes.
        </p>
      </div>

      <nav className="code-scrollbar flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
        {items.map((item) => {
          const selected = item.id === activeScreen;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`min-w-[160px] rounded-xl border px-3 py-2 text-left transition lg:w-full lg:px-4 lg:py-3 ${
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
