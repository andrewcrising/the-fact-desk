const HEALTH_TICKER = [
  "Public health",
  "Clinical research",
  "Policy guidance",
  "Evidence reviews",
  "Safety flags",
  "Not medical advice",
] as const;

export function HealthDeskIntro() {
  return (
    <header className="border-b border-[var(--border-subtle)] pb-2">
      <p className="desk-kicker mb-0.5 text-[9px] text-[var(--accent-muted)]">
        Evidence-aware health desk beta
      </p>
      <h2
        id="health-desk-heading"
        className="font-serif text-base font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-lg"
      >
        Health policy and research signals, separated by evidence and safety.
      </h2>
      <p className="mt-1 max-w-2xl text-[12px] leading-snug text-[var(--muted)]">
        Published health stories use the same editorial lifecycle. This is a
        public briefing surface, not personalized medical advice.
      </p>
    </header>
  );
}

export function HealthDeskTicker() {
  return (
    <div
      className="overflow-x-auto border border-[var(--border-subtle)] bg-[#fafbfc]"
      aria-label="Health desk goals ticker"
    >
      <div className="flex min-w-max divide-x divide-[var(--border-subtle)]">
        {HEALTH_TICKER.map((label) => (
          <div key={label} className="shrink-0 px-3 py-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
