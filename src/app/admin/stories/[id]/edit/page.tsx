import { AdminStoryForm } from "@/components/admin/AdminStoryForm";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopNav } from "@/components/layout/TopNav";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditStoryPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <>
      <TopNav />
      <main className="desk-canvas flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <AdminStoryForm storyId={id} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
