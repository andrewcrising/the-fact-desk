import type { ReactNode } from "react";
import type { ScreenId } from "../types/ridge";
import { Sidebar, type NavItem } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  items: NavItem[];
  activeScreen: ScreenId;
  activeLabel: string;
  onSelect: (screen: ScreenId) => void;
  children: ReactNode;
}

export function AppShell({ items, activeScreen, activeLabel, onSelect, children }: AppShellProps) {
  return (
    <div className="grid-overlay min-h-screen text-slate-200">
      <div className="grid min-h-screen lg:grid-cols-[300px_1fr]">
        <Sidebar items={items} activeScreen={activeScreen} onSelect={onSelect} />
        <div className="min-w-0">
          <TopBar activeLabel={activeLabel} />
          <main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8">{children}</main>
          <footer className="border-t border-ridge-border/70 px-5 py-5 text-center text-xs leading-6 text-slate-500 md:px-8">
            RIDGE Verification Workbench - demo prototype using mocked artifacts. For technical evaluation only.
          </footer>
        </div>
      </div>
    </div>
  );
}
