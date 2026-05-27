import { NAV_LINKS } from "@/data/navigation";
import { isLiveBetaEnabled } from "@/lib/story-repository";
import Link from "next/link";

export function TopNav() {
  const liveBeta = isLiveBetaEnabled();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white">
      <div className="border-b border-[var(--border-subtle)] bg-[#fafbfc]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-[10px] font-medium uppercase tracking-widest text-[var(--muted-light)] sm:px-6 lg:px-8">
          <span>Evidence-first news intelligence</span>
          <span className="hidden font-mono normal-case tracking-normal sm:inline">
            {liveBeta ? "Published desk + live RSS beta" : "Published story desk"}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 py-2 lg:flex-row lg:items-center lg:justify-between lg:py-2">
          <Link href="/" className="group flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center border border-[var(--border)] bg-[var(--accent)] font-serif text-xs font-bold text-white"
              aria-hidden
            >
              FD
            </div>
            <div>
              <span className="block font-serif text-base font-semibold tracking-tight text-[var(--foreground)] group-hover:text-[var(--accent)]">
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
            <a
              href="/#health-desk"
              className="shrink-0 px-2.5 py-1.5 text-[12px] font-medium text-[var(--muted-light)] hover:text-[var(--foreground)] sm:text-[13px]"
            >
              Health Desk
            </a>
          </nav>

          <a
            href="#brief-email"
            className="shrink-0 self-start border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-[var(--accent-muted)] lg:self-center"
          >
            Daily Brief
          </a>
        </div>
      </div>
    </header>
  );
}
