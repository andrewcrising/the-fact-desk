interface SiteFooterProps {
  showLiveBeta?: boolean;
}

export function SiteFooter({ showLiveBeta = false }: SiteFooterProps) {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <p className="mb-3 text-center text-[11px] leading-relaxed text-[var(--muted-light)] sm:text-xs">
          {showLiveBeta
            ? "Published briefings are database-backed when Supabase is configured. Live RSS beta items remain private/raw unless promoted and published."
            : "Published briefings are database-backed when Supabase is configured, with mock data only as a development fallback."}
        </p>
        <div className="flex flex-col gap-2 text-[11px] leading-relaxed text-[var(--muted-light)] sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-[var(--muted)]">
            © {new Date().getFullYear()} The Fact Desk
          </p>
          <p>Editorial labels summarize evidence posture, not final truth.</p>
        </div>
      </div>
    </footer>
  );
}
