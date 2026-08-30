import { createClient } from "@supabase/supabase-js";
import { RSS_FEEDS } from "../src/data/rssFeeds";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serverKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serverKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY (legacy SUPABASE_SERVICE_ROLE_KEY is also supported).",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serverKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Seeding configured Fact Desk sources only...");

  let upserted = 0;
  for (const feed of RSS_FEEDS) {
    const { error } = await supabase.from("sources").upsert(
      {
        name: feed.sourceName,
        homepage_url: feed.homepageUrl,
        feed_url: feed.feedUrl,
        source_type: feed.sourceType,
        credibility_score: feed.credibilityScore ?? null,
        political_or_editorial_label: feed.editorialLabel,
        active: feed.enabled,
      },
      { onConflict: "feed_url" },
    );

    if (error) {
      throw new Error(`Unable to seed ${feed.sourceName}: ${error.message}`);
    }
    upserted += 1;
  }

  console.log(`Upserted ${upserted} configured source records.`);
  console.log(
    "Source seed complete. No stories, feed items, editorial selections, or other demo content were written.",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
