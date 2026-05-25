const HEALTH_TICKER = [
  "Weight loss",
  "Muscle gain",
  "Longevity",
  "Functional medicine",
  "Safety flags",
  "Updated evidence",
] as const;

export function HealthDeskIntro() {
  return (
    <header className="border-b border-[var(--border-subtle)] pb-2">
      <p className="desk-kicker mb-0.5 text-[9px] text-[var(--accent-muted)]">
        Evidence-aware health desk
      </p>
      <h2
        id="health-desk-heading"
        className="font-serif text-base font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-lg"
      >
        Health guidance separated by evidence, goals, and safety.
      </h2>
      <p className="mt-1 max-w-2xl text-[12px] leading-snug text-[var(--muted)]">
        Weight loss, muscle gain, longevity, and functional medicine updates —
        organized by mainstream guidance, emerging evidence, and caution flags.
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
