/**
 * Dev: ingest enabled RSS feeds → data/live-stories.json
 * Run: npm run ingest:rss
 *
 * Does not modify mock stories. Homepage uses cache only when
 * NEXT_PUBLIC_SHOW_LIVE_BETA=true.
 */
import { getEnabledFeeds } from "../src/data/rssFeeds";
import { ingestEnabledFeeds } from "../src/lib/ingest/ingest-feeds";
import { writeLiveStoriesCache } from "../src/lib/live-stories-cache";

async function main() {
  const feeds = getEnabledFeeds();
  console.log(`Ingesting ${feeds.length} enabled feed(s)...`);

  try {
    const stories = await ingestEnabledFeeds();

    writeLiveStoriesCache({
      generatedAt: new Date().toISOString(),
      feedCount: feeds.length,
      stories,
    });

    if (stories.length === 0) {
      console.warn("No stories ingested. Feeds may be unavailable.");
      console.warn("Mock homepage data is unchanged.");
      process.exit(0);
    }

    console.log(`Saved ${stories.length} stories to data/live-stories.json`);
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Ingest failed:", message);
    console.error("Mock homepage data is unchanged.");
    process.exit(1);
  }
}

main();
