import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { AdminStoriesList } from "@/components/admin/AdminStoriesList";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopNav } from "@/components/layout/TopNav";

export default function AdminStoriesPage() {
  return (
    <>
      <TopNav />
      <main className="desk-canvas flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <AdminSetupNotice />
          <AdminStoriesList />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
