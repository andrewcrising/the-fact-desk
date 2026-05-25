import { Dashboard } from "@/components/layout/Dashboard";
import { Hero } from "@/components/layout/Hero";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopNav } from "@/components/layout/TopNav";
import {
  getHomepageStories,
  getLivePreviewStories,
  isLiveBetaEnabled,
} from "@/lib/story-repository";

export default function Home() {
  const stories = getHomepageStories();
  const showLiveBeta = isLiveBetaEnabled();
  const livePreviewStories = showLiveBeta ? getLivePreviewStories() : [];

  return (
    <>
      <TopNav />
      <Hero />
      <Dashboard
        stories={stories}
        livePreviewStories={livePreviewStories}
        showLiveBeta={showLiveBeta}
      />
      <SiteFooter />
    </>
  );
}
