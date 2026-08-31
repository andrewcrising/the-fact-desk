import { StoryDetail } from "@/components/story/StoryDetail";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopNav } from "@/components/layout/TopNav";
import { getLivePreviewStories } from "@/lib/story-repository";
import type { Story } from "@/types/story";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;
export const dynamic = "force-dynamic";

async function resolveStory(slug: string): Promise<Story | undefined> {
  const liveFeed = await getLivePreviewStories();
  return liveFeed.stories.find((story) => story.slug === slug);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await resolveStory(slug);
  if (!story) return { title: "Story not found" };
  return {
    title: `${story.title} — The Fact Desk`,
    description: story.summary,
  };
}

export default async function StoryPage({ params }: PageProps) {
  const { slug } = await params;
  const story = await resolveStory(slug);

  if (!story) {
    notFound();
  }

  return (
    <>
      <TopNav />
      <main className="desk-canvas flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <StoryDetail story={story} />
        </div>
      </main>
      <SiteFooter showLiveBeta />
    </>
  );
}
