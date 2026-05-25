import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopNav } from "@/components/layout/TopNav";
import Link from "next/link";

export default function StoryNotFound() {
  return (
    <>
      <TopNav />
      <main className="desk-canvas flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h1 className="font-serif text-2xl font-semibold text-[var(--foreground)]">
            Briefing not found
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            This story slug is not in the mock desk yet.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
          >
            ← Back to desk
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
