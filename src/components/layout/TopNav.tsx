import { NAV_LINKS } from "@/data/navigation";
import Link from "next/link";

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white">
      <div className="hidden border-b border-[var(--border-subtle)] bg-[#fafbfc] sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-[10px] font-medium uppercase tracking-widest text-[var(--muted-light)] sm:px-6 lg:px-8">
          <span>Evidence-first news intelligence</span>
          <span className="hidden font-mono normal-case tracking-normal sm:inline">
            Live priority desk · continuous source updates
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 py-1.5 sm:gap-2 sm:py-2 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="group flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center border border-[var(--border)] bg-[var(--accent)] font-serif text-[11px] font-bold text-white sm:h-8 sm:w-8 sm:text-xs"
              aria-hidden
            >
              FD
            </div>
            <div>
              <span className="block font-serif text-sm font-semibold tracking-tight text-[var(--foreground)] group-hover:text-[var(--accent)] sm:text-base">
                The Fact Desk
              </span>
              <span className="hidden text-[10px] text-[var(--muted-light)] sm:block">
                News signals ranked by evidence, not outrage.
              </span>
            </div>
          </Link>

          <nav
            className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-1 lg:justify-center lg:px-0"
            aria-label="Primary"
          >
            <Link
              href="/"
              className="shrink-0 px-2.5 py-1.5 text-[12px] font-medium text-[var(--muted)] hover:text-[var(--foreground)] sm:text-[13px]"
            >
              Desk
            </Link>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 px-2.5 py-1.5 text-[12px] font-medium text-[var(--muted)] hover:text-[var(--foreground)] sm:text-[13px]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/#health-desk"
              className="shrink-0 px-2.5 py-1.5 text-[12px] font-medium text-[var(--muted)] hover:text-[var(--foreground)] sm:text-[13px]"
            >
              Health Desk
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
