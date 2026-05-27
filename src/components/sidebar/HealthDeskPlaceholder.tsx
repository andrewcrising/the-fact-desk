import Link from "next/link";

export function HealthDeskPlaceholder() {
  return (
    <section
      id="health-desk-sidebar"
      className="desk-card overflow-hidden"
      aria-label="Health Desk preview"
    >
      <div className="border-b border-[var(--border-subtle)] bg-[#fafbfc] px-3 py-2">
        <p className="desk-kicker text-[9px]">Health Desk beta</p>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-[11px] leading-snug text-[var(--muted)]">
          Health stories use the same published-story lifecycle; this preview
          remains secondary while the desk grows.{" "}
          <Link href="/#health-desk" className="text-[var(--accent)] hover:underline">
            View section →
          </Link>
        </p>
      </div>
    </section>
  );
}
