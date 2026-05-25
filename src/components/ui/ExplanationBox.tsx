export function ExplanationBox() {
  return (
    <aside
      className="border-b border-[var(--border-subtle)] bg-[#fafbfc] px-4 py-1.5 sm:px-6 lg:px-8"
      aria-label="How The Fact Desk works"
    >
      <p className="mx-auto max-w-7xl text-[10px] leading-snug text-[var(--muted)] sm:text-[11px]">
        The Fact Desk separates confirmed facts from developing claims, source
        coverage, and under-covered signals. Labels are editorial signals, not
        declarations of truth.
      </p>
    </aside>
  );
}
