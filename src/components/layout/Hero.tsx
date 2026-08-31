export function Hero() {
  return (
    <section className="border-b border-[var(--border)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-1.5 sm:px-6 sm:py-3 lg:px-8">
        <header>
          <p className="desk-kicker mb-0.5 hidden text-[9px] text-[var(--accent-muted)] sm:block">
            Evidence-ranked briefing desk
          </p>
          <h1 className="font-serif text-[15px] font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-xl md:text-2xl">
            News signals ranked by evidence, not outrage.
          </h1>
          <p className="mt-1 hidden max-w-2xl text-[12px] leading-snug text-[var(--muted)] sm:block sm:text-[13px]">
            A calm briefing layer for source coverage, uncertainty, and
            under-reported signals.
          </p>
        </header>
        <p className="mt-2 hidden max-w-3xl border-t border-[var(--border-subtle)] pt-2 text-[10px] leading-snug text-[var(--muted-light)] sm:block sm:text-[11px]">
          The Fact Desk separates confirmed facts from developing claims, source
          coverage, and under-covered signals. Labels are editorial signals, not
          declarations of truth.
        </p>
      </div>
    </section>
  );
}
