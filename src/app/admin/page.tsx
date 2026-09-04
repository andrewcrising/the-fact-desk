import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopNav } from "@/components/layout/TopNav";
import Link from "next/link";

export default function AdminHomePage() {
  return (
    <>
      <TopNav />
      <main className="desk-canvas flex-1">
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
          <AdminSetupNotice />
          <section className="desk-card p-6">
            <p className="desk-kicker mb-2">Editorial MVP</p>
            <h1 className="font-serif text-3xl font-semibold">Admin desk</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
              Internal tools for the MVP lifecycle: ingest RSS candidates, promote
              feed items into drafts, edit stories, attach sources, publish, archive,
              and set homepage placement.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[var(--muted-light)]">
              API writes require an ADMIN_API_TOKEN bearer token. Paste that token
              into admin pages; it is stored only in this browser for MVP convenience.
            </p>
          </section>

          <div className="grid gap-4 sm:grid-cols-4">
            <Link href="/admin/feed-inbox" className="desk-card p-4 hover:border-[var(--accent)]">
              <p className="desk-kicker mb-2">Step 1</p>
              <h2 className="font-serif text-xl font-semibold">Feed Inbox</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Ingest RSS and review raw candidates.
              </p>
            </Link>
            <Link href="/admin/stories" className="desk-card p-4 hover:border-[var(--accent)]">
              <p className="desk-kicker mb-2">Step 2</p>
              <h2 className="font-serif text-xl font-semibold">Stories</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Manage draft, published, and archived stories.
              </p>
            </Link>
            <Link href="/admin/stories/new" className="desk-card p-4 hover:border-[var(--accent)]">
              <p className="desk-kicker mb-2">Manual</p>
              <h2 className="font-serif text-xl font-semibold">New Story</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Create a draft directly with source attachments.
              </p>
            </Link>
            <Link href="/admin/automation" className="desk-card p-4 hover:border-[var(--accent)]">
              <p className="desk-kicker mb-2">Automation</p>
              <h2 className="font-serif text-xl font-semibold">Pipeline</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Run self-updating briefing pipeline and review automation logs.
              </p>
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
