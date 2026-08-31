interface SiteFooterProps {
  showLiveBeta?: boolean;
}

export function SiteFooter({ showLiveBeta = true }: SiteFooterProps) {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <p className="mb-3 text-center text-[11px] leading-relaxed text-[var(--muted-light)] sm:text-xs">
          {showLiveBeta
            ? "Live reporting is ranked by editorial urgency and labeled by evidence depth. Story synopses update as source coverage changes."
            : "Live source data is temporarily unavailable; demonstration stories are not substituted."}
        </p>
        <div className="flex flex-col gap-2 text-[11px] leading-relaxed text-[var(--muted-light)] sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-[var(--muted)]">
            © {new Date().getFullYear()} The Fact Desk
          </p>
          <p>Priority is not certainty. Evidence labels show support separately.</p>
        </div>
      </div>
    </footer>
  );
}
