import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopNav } from "@/components/layout/TopNav";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Independence & Funding — The Fact Desk",
  description:
    "How The Fact Desk plans to remain free, viewpoint-balanced, and independent of paid story placement.",
};

export default function IndependencePage() {
  return (
    <>
      <TopNav />
      <main className="desk-canvas flex-1">
        <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <Link
            href="/"
            className="text-[13px] font-semibold text-[var(--accent)] hover:underline"
          >
            ← Back to the desk
          </Link>

          <header className="mt-6 border-b border-[var(--border)] pb-6">
            <p className="desk-kicker">Public-interest model</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl">
              Independent news context, supported by readers
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--muted)]">
              The Fact Desk is being built as a free, evidence-first briefing
              service. We want useful factual context to remain available to
              everyone, without selling influence over story selection or
              priority.
            </p>
          </header>

          <div className="mt-6 space-y-4">
            <section id="briefing" className="desk-card p-5 sm:p-6">
              <p className="desk-kicker">Free briefing</p>
              <h2 className="mt-1 font-serif text-xl font-semibold">
                A useful habit, not another noisy newsletter
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                The planned briefing will summarize the highest-priority
                developments, what happened, why each story matters, and where
                reporting differs. It will remain free. Signup will open after
                the delivery service is connected and verified.
              </p>
            </section>

            <section id="support" className="desk-card p-5 sm:p-6">
              <p className="desk-kicker">Voluntary member support</p>
              <h2 className="mt-1 font-serif text-xl font-semibold">
                Support will be optional
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Readers will be able to support the desk voluntarily while the
                core news experience stays open. Payment options are not active
                yet; no contribution is being requested until the payment path
                and disclosures are ready.
              </p>
            </section>

            <section className="desk-card p-5 sm:p-6">
              <p className="desk-kicker">Editorial firewall</p>
              <h2 className="mt-1 font-serif text-xl font-semibold">
                Money does not determine priority
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--muted)]">
                <li>Story placement and priority will not be sold.</li>
                <li>Supporters will not receive editorial control.</li>
                <li>Any future sponsor will be clearly labeled.</li>
                <li>
                  Evidence confidence and viewpoint balance will remain
                  separate from funding.
                </li>
              </ul>
            </section>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
