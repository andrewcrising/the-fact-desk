import { getEnabledFeeds } from "../src/data/rssFeeds";
import { parseRssItems } from "../src/lib/ingest/rss";

const strict = process.argv.includes("--strict");
const timeoutMs = 15_000;

interface FeedHealthResult {
  id: string;
  source: string;
  url: string;
  ok: boolean;
  status: number | null;
  contentType: string | null;
  itemCount: number;
  latestPublishedAt: string | null;
  message: string;
}

function latestPublishedAt(items: ReturnType<typeof parseRssItems>): string | null {
  const timestamps = items
    .map((item) => (item.pubDate ? Date.parse(item.pubDate) : Number.NaN))
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

async function checkFeed(feed: ReturnType<typeof getEnabledFeeds>[number]): Promise<FeedHealthResult> {
  try {
    const response = await fetch(feed.feedUrl, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml, application/atom+xml, */*",
        "User-Agent": "TheFactDesk/0.1 (feed health check)",
      },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "follow",
    });

    const contentType = response.headers.get("content-type");
    const body = await response.text();
    const items = response.ok ? parseRssItems(body) : [];
    const ok = response.ok && items.length > 0;

    return {
      id: feed.id,
      source: feed.sourceName,
      url: feed.feedUrl,
      ok,
      status: response.status,
      contentType,
      itemCount: items.length,
      latestPublishedAt: latestPublishedAt(items),
      message: ok
        ? "feed parsed successfully"
        : response.ok
          ? "request succeeded but no RSS/Atom items parsed"
          : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      id: feed.id,
      source: feed.sourceName,
      url: feed.feedUrl,
      ok: false,
      status: null,
      contentType: null,
      itemCount: 0,
      latestPublishedAt: null,
      message: error instanceof Error ? error.message : "unknown feed-health error",
    };
  }
}

async function main() {
  const feeds = getEnabledFeeds();
  const results: FeedHealthResult[] = [];

  for (const feed of feeds) {
    const result = await checkFeed(feed);
    results.push(result);
    console.log(
      `[feed-health] ${result.ok ? "OK" : "FAIL"} ${result.source} status=${result.status ?? "n/a"} items=${result.itemCount} latest=${result.latestPublishedAt ?? "n/a"} ${result.message}`,
    );
  }

  const failed = results.filter((result) => !result.ok);
  console.log(
    `[feed-health] summary enabled=${results.length} healthy=${results.length - failed.length} failed=${failed.length}`,
  );
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));

  if (strict && failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = strict ? 1 : 0;
});
