import { StoryDetail } from "@/components/story/StoryDetail";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopNav } from "@/components/layout/TopNav";
import { resolveReaderStoryBySlug } from "@/lib/reader-story";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Published Supabase stories are created after deployment, so story routes
// must resolve from the durable repository at request time rather than from a
// build-time list of mock/cache slugs.
export const dynamic = "force-dynamic";

const getReaderStory = cache(resolveReaderStoryBySlug);

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getReaderStory(slug);
  if (!story) return { title: "Story not found" };
  return {
    title: `${story.title} — The Fact Desk`,
    description: story.summary,
  };
}

export default async function StoryPage({ params }: PageProps) {
  const { slug } = await params;
  const story = await getReaderStory(slug);

  if (!story) notFound();

  return (
    <>
      <TopNav />
      <main className="desk-canvas flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <StoryDetail story={story} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
