import { SidebarPanel } from "@/components/ui/SidebarPanel";
import Link from "next/link";

interface ReaderSupportCardProps {
  className?: string;
}

export function ReaderSupportCard({ className = "" }: ReaderSupportCardProps) {
  const briefingUrl = process.env.NEXT_PUBLIC_BRIEFING_SIGNUP_URL;
  const supportUrl = process.env.NEXT_PUBLIC_SUPPORT_URL;

  return (
    <div className={className}>
      <SidebarPanel title="Independent by design">
        <p className="text-[13px] leading-relaxed text-[var(--muted)]">
          The Fact Desk is free to read and does not sell story placement. Our
          goal is to be sustained by readers who value viewpoint-balanced,
          evidence-first news.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-light)]">
          <span>Free briefing</span>
          <span aria-hidden>·</span>
          <span>Voluntary support</span>
          <span aria-hidden>·</span>
          <span>No paid placement</span>
        </div>
        {(briefingUrl || supportUrl) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {briefingUrl && (
              <a
                href={briefingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center border border-[var(--accent)] bg-[var(--accent)] px-3 text-[11px] font-semibold text-white hover:bg-[var(--accent-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              >
                Join free briefing
              </a>
            )}
            {supportUrl && (
              <a
                href={supportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center border border-[var(--border)] bg-white px-3 text-[11px] font-semibold text-[var(--accent)] hover:border-[var(--accent-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              >
                Support the desk
              </a>
            )}
          </div>
        )}
        <Link
          href="/independence"
          className="mt-3 inline-flex min-h-10 items-center text-[12px] font-semibold text-[var(--accent)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        >
          How reader support will work →
        </Link>
      </SidebarPanel>
    </div>
  );
}
